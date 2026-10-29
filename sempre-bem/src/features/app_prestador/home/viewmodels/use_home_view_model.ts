import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
    aceitarChamadoPrestador,
    atualizarDisponibilidadePrestador,
    buscarDadosHomePrestador,
    cancelarAtendimentoPrestador,
    iniciarAtendimentoPrestador,
    type ChamadoAtualPrestador,
    type PrestadorApi,
} from "@/features/app_prestador/home/service/api_prestador";

export function useHomeViewModel() {
    const router = useRouter();
    const { prestadorId: prestadorIdParam } = useLocalSearchParams<{ prestadorId?: string | string[] }>();
    const prestadorId = Array.isArray(prestadorIdParam) ? prestadorIdParam[0] : prestadorIdParam ?? "1";
    const [prestador, setPrestador] = useState<PrestadorApi | null>(null);
    const [currentCall, setCurrentCall] = useState<ChamadoAtualPrestador | null>(null);
    const [isLoadingProvider, setIsLoadingProvider] = useState(true);
    const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
    const [isAcceptingCall, setIsAcceptingCall] = useState(false);
    const [isCancellingAttendance, setIsCancellingAttendance] = useState(false);
    const [isStartingAttendance, setIsStartingAttendance] = useState(false);
    const [acceptCallError, setAcceptCallError] = useState<string>();
    const [providerError, setProviderError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoadingProvider(true);
        setProviderError(undefined);

        const loadProvider = (showLoading: boolean) => buscarDadosHomePrestador(prestadorId, controller.signal)
            .then(({ chamadoAtual, prestador: loadedProvider }) => {
                setCurrentCall(chamadoAtual);
                setPrestador(loadedProvider);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                setProviderError(
                    "Não foi possível carregar os dados do profissional.",
                );
            })
            .finally(() => {
                if (showLoading && !controller.signal.aborted) {
                    setIsLoadingProvider(false);
                }
            });

        void loadProvider(true);
        const interval = setInterval(() => void loadProvider(false), 3000);

        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [prestadorId, reloadKey]);

    const isAvailable = prestador?.status_disponibilidade === "DISPONIVEL";

    async function toggleAvailability() {
        if (!prestador || isUpdatingAvailability) {
            return;
        }

        setIsUpdatingAvailability(true);
        setProviderError(undefined);

        try {
            const updatedProvider = await atualizarDisponibilidadePrestador(
                prestador.id_cuidador,
                !isAvailable,
            );
            setPrestador(updatedProvider);
            setReloadKey((current) => current + 1);
        } catch {
            setProviderError("Não foi possível atualizar sua disponibilidade.");
        } finally {
            setIsUpdatingAvailability(false);
        }
    }

    async function acceptCurrentCall() {
        if (!currentCall || !prestador || currentCall.status !== "PENDENTE" || isAcceptingCall) {
            return false;
        }

        setIsAcceptingCall(true);
        setAcceptCallError(undefined);

        try {
            await aceitarChamadoPrestador(
                currentCall,
                prestador,
            );
            setReloadKey((current) => current + 1);
            return true;
        } catch (error) {
            setAcceptCallError(
                error instanceof Error && (
                    error.message.includes("já aceitou") ||
                    error.message.includes("não está mais disponível")
                )
                    ? error.message
                    : "Não foi possível aceitar o chamado. Tente novamente.",
            );
            return false;
        } finally {
            setIsAcceptingCall(false);
        }
    }

    async function cancelCurrentAttendance() {
        if (!currentCall || !prestador || isCancellingAttendance) return false;
        setIsCancellingAttendance(true);
        setProviderError(undefined);
        try {
            await cancelarAtendimentoPrestador(currentCall, prestador);
            setCurrentCall(null);
            setPrestador((current) => current ? { ...current, status_disponibilidade: "DISPONIVEL" } : current);
            return true;
        } catch {
            setProviderError("Não foi possível cancelar o atendimento.");
            return false;
        } finally {
            setIsCancellingAttendance(false);
        }
    }

    async function startCurrentAttendance(code: string) {
        if (!currentCall?.appointmentId || currentCall.status !== "A_CAMINHO" || isStartingAttendance) {
            return false;
        }

        setIsStartingAttendance(true);
        setProviderError(undefined);
        try {
            await iniciarAtendimentoPrestador(currentCall.appointmentId, code);
            setReloadKey((current) => current + 1);
            return true;
        } catch (error) {
            setProviderError(
                error instanceof Error ? error.message : "Não foi possível iniciar o atendimento.",
            );
            return false;
        } finally {
            setIsStartingAttendance(false);
        }
    }

    return {
        acceptCallError,
        acceptCurrentCall,
        openProviderProfile: () => router.push({
            pathname: "/perfil-prestador",
            params: { prestadorId },
        }),
        cancelCurrentAttendance,
        clearAcceptCallError: () => setAcceptCallError(undefined),
        currentCall,
        goToAttendanceRecords: () => router.push({ pathname: "/atendimento-prestador", params: { prestadorId } }),
        isAvailable,
        isAcceptingCall,
        isCancellingAttendance,
        isLoadingProvider,
        isStartingAttendance,
        isUpdatingAvailability,
        prestador,
        providerError,
        reloadProvider: () => setReloadKey((current) => current + 1),
        openCurrentCallRoute: () => router.push({ pathname: "/prestador-rota", params: { prestadorId } }),
        openCurrentChat: () => {
            if (!currentCall?.appointmentId) return;
            router.push({
                pathname: "/chat",
                params: {
                    atendimentoId: currentCall.appointmentId,
                    usuarioId: prestadorId,
                    usuarioTipo: "PRESTADOR",
                },
            } as never);
        },
        startCurrentAttendance,
        toggleAvailability,
    };
}
