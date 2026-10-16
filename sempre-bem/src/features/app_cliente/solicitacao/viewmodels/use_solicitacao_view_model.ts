import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCurrentLocation } from "@/core/service/location_service";
import {
    CAREGIVER_SERVICES,
    getProfessionalRecommendation,
    NURSE_SERVICES,
    parseCustomDuration,
} from "@/features/app_cliente/solicitacao/service/solicitacao_service";
import {
    cancelarSolicitacao,
    criarSolicitacao,
} from "@/features/app_cliente/solicitacao/service/api_solicitacao";

const DEFAULT_COORDINATE = {
    latitude: -23.5898,
    longitude: -46.6346,
};
const CLIENT_FAMILY_ID = "1";

export function useSolicitacaoViewModel() {
    const router = useRouter();
    const { familiar = "Familiar", idosoId } = useLocalSearchParams<{
        familiar?: string;
        idosoId?: string;
    }>();
    const [address, setAddress] = useState("");
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
    const [details, setDetails] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState<string>();
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
        if (!idosoId) {
            setSubmitError("Não foi possível identificar o familiar selecionado.");
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
                id_familia: CLIENT_FAMILY_ID,
                id_idoso: String(idosoId),
                servico: [...selectedServices, ...customServices].join(", "),
            });
            setActiveRequestId(createdRequest.id);

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
        details,
        duration,
        familiar: String(familiar),
        goBack: () => router.back(),
        hasCurrentLocation,
        isCancelling,
        isCustomDurationVisible,
        isCustomServiceVisible,
        isSearching,
        isSubmitting,
        clearCancelError: () => setCancelError(undefined),
        openCustomDuration,
        openCustomService,
        recommendation,
        removeCustomService,
        selectDuration,
        selectedServiceIds,
        setDetails,
        submitRequest,
        submitError,
        startSearch: () => setIsSearching(true),
        toggleService,
    };
}
