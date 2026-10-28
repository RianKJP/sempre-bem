import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
    aceitarChamadoPrestador,
    atualizarDisponibilidadePrestador,
    atualizarValorHoraPrestador,
    buscarDadosHomePrestador,
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
    const [isUpdatingHourlyRate, setIsUpdatingHourlyRate] = useState(false);
    const [isAcceptingCall, setIsAcceptingCall] = useState(false);
    const [acceptCallError, setAcceptCallError] = useState<string>();
    const [providerError, setProviderError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoadingProvider(true);
        setProviderError(undefined);

        buscarDadosHomePrestador(prestadorId, controller.signal)
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
                if (!controller.signal.aborted) {
                    setIsLoadingProvider(false);
                }
            });

        return () => controller.abort();
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

    async function updateHourlyRate(value: number) {
        if (!prestador || isUpdatingHourlyRate) return;

        setIsUpdatingHourlyRate(true);
        try {
            const updatedProvider = await atualizarValorHoraPrestador(
                prestador.id_cuidador,
                value,
            );
            setPrestador(updatedProvider);
        } finally {
            setIsUpdatingHourlyRate(false);
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

    return {
        acceptCallError,
        acceptCurrentCall,
        changeProfile: () => router.replace("/"),
        clearAcceptCallError: () => setAcceptCallError(undefined),
        currentCall,
        isAvailable,
        isAcceptingCall,
        isLoadingProvider,
        isUpdatingAvailability,
        isUpdatingHourlyRate,
        prestador,
        providerError,
        reloadProvider: () => setReloadKey((current) => current + 1),
        toggleAvailability,
        updateHourlyRate,
    };
}
