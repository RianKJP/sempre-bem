import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCurrentLocation } from "@/core/service/location_service";
import { buscarCuidador, buscarIdososDaFamilia } from "@/features/app_cliente/home/service/api_cliente";
import {
    CAREGIVER_SERVICES,
    getProfessionalRecommendation,
    NURSE_SERVICES,
    parseCustomDuration,
} from "@/features/app_cliente/solicitacao/service/solicitacao_service";
import {
    buscarSolicitacao,
    cancelarSolicitacao,
    criarSolicitacao,
    type PrestadorAceiteApi,
    type SolicitacaoAtendimentoApi,
} from "@/features/app_cliente/solicitacao/service/api_solicitacao";

const DEFAULT_COORDINATE = {
    latitude: -23.5898,
    longitude: -46.6346,
};

export type PaymentMethod = "DINHEIRO" | "PIX";

export type CareRecipientOption = {
    id: string;
    name: string;
    relationship: string;
};

async function resolveAcceptedProviders(
    request: SolicitacaoAtendimentoApi,
    signal?: AbortSignal,
): Promise<PrestadorAceiteApi[]> {
    if (request.cuidadores_aceitaram?.length) return request.cuidadores_aceitaram;
    if (!request.id_cuidador) return [];

    const provider = await buscarCuidador(String(request.id_cuidador), signal);
    const hourlyRate = provider.valor_hora ?? 0;

    return [{
        aceito_em: request.data_hora_resposta ?? request.data_hora_solicitada,
        id_cuidador: provider.id_cuidador,
        nome: provider.nome,
        tipo_profissional: provider.tipo_profissional ?? "CUIDADOR",
        valor_hora: hourlyRate,
        valor_total: request.duracao_horas * hourlyRate,
    }];
}

export function useSolicitacaoViewModel() {
    const router = useRouter();
    const { familiar = "Familiar", familiaId = "1", idosoId, solicitacaoId } = useLocalSearchParams<{
        familiar?: string;
        familiaId?: string;
        idosoId?: string;
        solicitacaoId?: string;
    }>();
    const [address, setAddress] = useState("");
    const [selectedElderId, setSelectedElderId] = useState(idosoId ? String(idosoId) : "");
    const [selectedElderName, setSelectedElderName] = useState(idosoId ? String(familiar) : "");
    const [careRecipients, setCareRecipients] = useState<CareRecipientOption[]>([]);
    const [isLoadingCareRecipients, setIsLoadingCareRecipients] = useState(true);
    const [careRecipientsError, setCareRecipientsError] = useState<string>();
    const [careRecipientsReloadKey, setCareRecipientsReloadKey] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
    const [addressHelperText, setAddressHelperText] = useState("Buscando seu endereço atual...");
    const [coordinate, setCoordinate] = useState(DEFAULT_COORDINATE);
    const [hasCurrentLocation, setHasCurrentLocation] = useState(false);
    const [duration, setDuration] = useState(3);
    const [isCustomDurationVisible, setIsCustomDurationVisible] = useState(false);
    const [customDuration, setCustomDuration] = useState("");
    const [customDurationError, setCustomDurationError] = useState<string>();
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [customServices, setCustomServices] = useState<string[]>([]);
    const [isCustomServiceVisible, setIsCustomServiceVisible] = useState(false);
    const [customService, setCustomService] = useState("");
    const [customServiceError, setCustomServiceError] = useState<string>();
    const [isSearching, setIsSearching] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState<string>();
    const [acceptedProviders, setAcceptedProviders] = useState<PrestadorAceiteApi[]>([]);
    const [cancelError, setCancelError] = useState<string>();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>();
    const addressWasEdited = useRef(false);

    const recommendation = useMemo(
        () => getProfessionalRecommendation(selectedServiceIds),
        [selectedServiceIds],
    );

    useEffect(() => {
        if (!solicitacaoId) return;

        const controller = new AbortController();

        void buscarSolicitacao(String(solicitacaoId), controller.signal)
            .then(async (request) => {
                if (request.status !== "PENDENTE" && request.status !== "ACEITA") {
                    setSubmitError("Este chamado não está mais em busca de prestadores.");
                    return;
                }

                const requestedServices = request.servico
                    .split(",")
                    .map((service) => service.trim())
                    .filter(Boolean);
                const knownServices = [...CAREGIVER_SERVICES, ...NURSE_SERVICES];
                const selectedIds = knownServices
                    .filter((service) => requestedServices.some(
                        (requested) => requested.toLocaleLowerCase() === service.label.toLocaleLowerCase(),
                    ))
                    .map((service) => service.id);
                const additionalServices = requestedServices.filter(
                    (requested) => !knownServices.some(
                        (service) => service.label.toLocaleLowerCase() === requested.toLocaleLowerCase(),
                    ),
                );

                addressWasEdited.current = true;
                setActiveRequestId(request.id);
                setAcceptedProviders(await resolveAcceptedProviders(request, controller.signal));
                setAddress(request.endereco_atendimento);
                setDuration(request.duracao_horas);
                setPaymentMethod(request.forma_pagamento);
                setSelectedElderId(request.id_idoso);
                setSelectedServiceIds(selectedIds);
                setCustomServices(additionalServices);
                setSubmitError(undefined);
                setIsSearching(true);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === "AbortError") return;
                setSubmitError("Não foi possível retomar o chamado pendente.");
            });

        return () => controller.abort();
    }, [solicitacaoId]);

    useEffect(() => {
        if (!isSearching || !activeRequestId) return;

        let requestInProgress = false;
        const controller = new AbortController();

        const syncAcceptedProviders = async () => {
            if (requestInProgress) return;
            requestInProgress = true;

            try {
                const request = await buscarSolicitacao(activeRequestId, controller.signal);
                setAcceptedProviders(await resolveAcceptedProviders(request, controller.signal));
            } catch (error) {
                if (!(error instanceof Error && error.name === "AbortError")) {
                    setSubmitError("Não foi possível atualizar os prestadores que aceitaram.");
                }
            } finally {
                requestInProgress = false;
            }
        };

        void syncAcceptedProviders();
        const interval = setInterval(() => void syncAcceptedProviders(), 2500);

        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [activeRequestId, isSearching]);

    useEffect(() => {
        let isMounted = true;

        async function fillCurrentLocation() {
            const currentLocation = await getCurrentLocation();

            if (!isMounted) {
                return;
            }

            if (!currentLocation) {
                setAddressHelperText("Não foi possível detectar o endereço. Preencha-o manualmente.");
                return;
            }

            setCoordinate({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            });
            setHasCurrentLocation(true);

            if (!addressWasEdited.current && currentLocation.address) {
                setAddress(currentLocation.address);
                setAddressHelperText("Endereço preenchido pela localização do aparelho. Você pode alterá-lo.");
                return;
            }

            setAddressHelperText("Localização encontrada. Informe o endereço completo.");
        }

        void fillCurrentLocation();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoadingCareRecipients(true);
        setCareRecipientsError(undefined);
        void buscarIdososDaFamilia(String(familiaId), controller.signal)
            .then((people) => {
                setCareRecipients(people.map((person) => ({
                    id: person.id_idoso,
                    name: person.nome,
                    relationship: person.relacao || "Pessoa cuidada",
                })));

                if (idosoId) {
                    const selectedPerson = people.find((person) => person.id_idoso === String(idosoId));
                    setSelectedElderId(String(idosoId));
                    setSelectedElderName(selectedPerson?.nome ?? String(familiar));
                }
            })
            .catch((failure: unknown) => {
                if (failure instanceof Error && failure.name === "AbortError") return;
                setCareRecipientsError("Não foi possível carregar as pessoas cuidadas.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoadingCareRecipients(false);
            });
        return () => controller.abort();
    }, [careRecipientsReloadKey, familiaId, familiar, idosoId]);

    function selectCareRecipient(id: string) {
        const person = careRecipients.find((option) => option.id === id);
        if (!person) return;

        setSelectedElderId(person.id);
        setSelectedElderName(person.name);
        setSubmitError(undefined);
    }

    function changeAddress(value: string) {
        addressWasEdited.current = true;
        setAddress(value);
        setAddressHelperText("Endereço alterado manualmente.");
    }

    function selectDuration(hours: number) {
        setDuration(hours);
        setIsCustomDurationVisible(false);
        setCustomDurationError(undefined);
    }

    function openCustomDuration() {
        setCustomDuration(duration > 8 ? String(duration) : "");
        setCustomDurationError(undefined);
        setIsCustomDurationVisible(true);
    }

    function confirmCustomDuration() {
        const parsedDuration = parseCustomDuration(customDuration);

        if (parsedDuration === null) {
            setCustomDurationError("Informe uma quantidade entre 1 e 24 horas.");
            return;
        }

        setDuration(parsedDuration);
        setIsCustomDurationVisible(false);
    }

    function toggleService(serviceId: string) {
        setSelectedServiceIds((current) =>
            current.includes(serviceId)
                ? current.filter((id) => id !== serviceId)
                : [...current, serviceId],
        );
    }

    function openCustomService() {
        setCustomService("");
        setCustomServiceError(undefined);
        setIsCustomServiceVisible(true);
    }

    function addCustomService() {
        const normalizedService = customService.trim();

        if (normalizedService.length < 3) {
            setCustomServiceError("Descreva o serviço com pelo menos 3 caracteres.");
            return;
        }

        if (customServices.some((service) => service.toLocaleLowerCase() === normalizedService.toLocaleLowerCase())) {
            setCustomServiceError("Este serviço já foi adicionado.");
            return;
        }

        setCustomServices((current) => [...current, normalizedService]);
        setCustomService("");
        setCustomServiceError(undefined);
        setIsCustomServiceVisible(false);
    }

    function removeCustomService(serviceToRemove: string) {
        setCustomServices((current) => current.filter((service) => service !== serviceToRemove));
    }

    async function submitRequest() {
        if (!selectedElderId) {
            setSubmitError("Cadastre ou selecione uma pessoa cuidada antes de iniciar a busca.");
            return false;
        }

        if (!paymentMethod) {
            setSubmitError("Selecione a forma de pagamento antes de iniciar a busca.");
            return false;
        }

        setIsSubmitting(true);
        setSubmitError(undefined);

        try {
            const selectedServices = [...CAREGIVER_SERVICES, ...NURSE_SERVICES]
                .filter((service) => selectedServiceIds.includes(service.id))
                .map((service) => service.label);

            const createdRequest = await criarSolicitacao({
                duracaoHoras: duration,
                enderecoAtendimento: address.trim(),
                formaPagamento: paymentMethod,
                id_familia: String(familiaId),
                id_idoso: selectedElderId,
                servico: [...selectedServices, ...customServices].join(", "),
            });
            setActiveRequestId(createdRequest.id);
            setAcceptedProviders(createdRequest.cuidadores_aceitaram ?? []);

            return true;
        } catch {
            setSubmitError(
                "Não foi possível criar a solicitação. Verifique se o JSON Server está ativo.",
            );
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function cancelActiveRequest() {
        if (!activeRequestId) {
            setCancelError("Não foi possível identificar o chamado ativo.");
            return false;
        }

        setIsCancelling(true);
        setCancelError(undefined);

        try {
            await cancelarSolicitacao(activeRequestId);
            setActiveRequestId(undefined);
            return true;
        } catch {
            setCancelError(
                "Não foi possível cancelar o chamado. Verifique se o JSON Server está ativo.",
            );
            return false;
        } finally {
            setIsCancelling(false);
        }
    }

    return {
        acceptedProviders,
        addCustomService,
        address,
        addressHelperText,
        cancelActiveRequest,
        cancelError,
        changeAddress,
        changeCustomDuration: (value: string) => {
            setCustomDuration(value.replace(/\D/g, ""));
            setCustomDurationError(undefined);
        },
        changeCustomService: (value: string) => {
            setCustomService(value);
            setCustomServiceError(undefined);
        },
        confirmCustomDuration,
        coordinate,
        cancelSearch: () => setIsSearching(false),
        customDuration,
        customDurationError,
        customService,
        customServiceError,
        customServices,
        careRecipients,
        careRecipientsError,
        duration,
        familiar: selectedElderName,
        familiaId: String(familiaId),
        goBack: () => router.back(),
        hasCurrentLocation,
        isCancelling,
        isCustomDurationVisible,
        isCustomServiceVisible,
        isLoadingCareRecipients,
        isSearching,
        isSubmitting,
        clearCancelError: () => setCancelError(undefined),
        openCustomDuration,
        openCustomService,
        paymentMethod,
        recommendation,
        reloadCareRecipients: () => setCareRecipientsReloadKey((current) => current + 1),
        returnToClientHomeForDebug: () => router.replace({
            pathname: "/cliente",
            params: { familiaId: String(familiaId) },
        }),
        removeCustomService,
        selectDuration,
        selectCareRecipient,
        selectPaymentMethod: (method: PaymentMethod) => {
            setPaymentMethod(method);
            setSubmitError(undefined);
        },
        selectedElderId,
        selectedServiceIds,
        submitRequest,
        submitError,
        startSearch: () => setIsSearching(true),
        toggleService,
    };
}
