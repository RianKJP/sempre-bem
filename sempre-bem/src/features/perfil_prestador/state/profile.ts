import { useCallback, useEffect, useState } from "react";

import { PROVIDER_API_ENDPOINTS } from "@/features/app_prestador/config/api_config";
import { getAuthenticatedAccount, saveAuthenticatedAccount } from "@/features/autenticacao/service/auth_session_repository";

export type ProviderProfile = {
    description: string;
    education: string;
    email: string;
    experience: string;
    hourlyRate: number | null;
    id: string;
    name: string;
    phone: string;
    specialties: string[];
    type: "CUIDADOR" | "ENFERMEIRO";
};

export type ProviderProfileInput = Omit<ProviderProfile, "hourlyRate" | "id">;
export type ProviderProfileErrors = Partial<Record<keyof ProviderProfileInput, string>>;

type ProviderApi = {
    descricao_profissional?: string;
    email: string;
    especialidades?: string[];
    formacao?: string;
    id: string;
    id_cuidador?: string;
    nome: string;
    telefone?: string;
    tempo_experiencia?: string;
    tipo_profissional?: "CUIDADOR" | "ENFERMEIRO";
    valor_hora?: number | null;
};

function mapProvider(provider: ProviderApi): ProviderProfile {
    return {
        description: provider.descricao_profissional ?? "",
        education: provider.formacao ?? "",
        email: provider.email,
        experience: provider.tempo_experiencia ?? "",
        hourlyRate: provider.valor_hora ?? null,
        id: provider.id_cuidador ?? provider.id,
        name: provider.nome,
        phone: provider.telefone ?? "",
        specialties: provider.especialidades ?? [],
        type: provider.tipo_profissional ?? "CUIDADOR",
    };
}

export function validateProviderProfile(input: ProviderProfileInput): ProviderProfileErrors {
    const errors: ProviderProfileErrors = {};
    if (input.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = "Informe um e-mail válido.";
    if (!/^\d{10,11}$/.test(input.phone.replace(/\D/g, ""))) errors.phone = "Informe telefone com DDD.";
    if (!input.experience.trim()) errors.experience = "Informe o tempo de experiência.";
    if (!input.education.trim()) errors.education = "Informe sua formação.";
    if (!input.specialties.length) errors.specialties = "Selecione ao menos uma especialidade.";
    return errors;
}

export function useProviderProfile(providerId?: string) {
    const [profile, setProfile] = useState<ProviderProfile>();
    const [loading, setLoading] = useState(Boolean(providerId));
    const [error, setError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!providerId) { setLoading(false); return; }
        const controller = new AbortController();
        let active = true;
        let hasLocal = false;
        setLoading(true);
        setError(undefined);
        void (async () => {
            try {
                const account = await getAuthenticatedAccount("profissional");
                if (active && account?.userId === providerId) {
                    hasLocal = true;
                    setProfile({
                        description: "", education: "", email: account.email, experience: "",
                        hourlyRate: null, id: account.userId, name: account.name, phone: account.phone ?? "",
                        specialties: [], type: "CUIDADOR",
                    });
                    setLoading(false);
                }
            } catch { /* API continua sendo a fonte oficial. */ }
            try {
                const response = await fetch(PROVIDER_API_ENDPOINTS.prestador(providerId), { signal: controller.signal });
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                const updated = mapProvider(await response.json() as ProviderApi);
                if (!active) return;
                setProfile(updated);
                await saveAuthenticatedAccount({ email: updated.email, name: updated.name, phone: updated.phone, profile: "profissional", userId: updated.id });
            } catch (failure) {
                if (failure instanceof Error && failure.name === "AbortError") return;
                if (active && !hasLocal) setError("Não foi possível carregar o perfil profissional.");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; controller.abort(); };
    }, [providerId, reloadKey]);

    const updateProfile = useCallback(async (input: ProviderProfileInput) => {
        if (!providerId) throw new Error("Profissional não identificado.");
        const response = await fetch(PROVIDER_API_ENDPOINTS.prestador(providerId), {
            body: JSON.stringify({
                descricao_profissional: input.description.trim(),
                email: input.email.trim().toLocaleLowerCase("pt-BR"),
                especialidades: input.specialties,
                formacao: input.education.trim(),
                nome: input.name.trim(),
                telefone: input.phone.replace(/\D/g, ""),
                tempo_experiencia: input.experience.trim(),
                tipo_profissional: input.type,
            }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        if (!response.ok) throw new Error("Não foi possível atualizar o perfil.");
        const updated = mapProvider(await response.json() as ProviderApi);
        setProfile(updated);
        await saveAuthenticatedAccount({ email: updated.email, name: updated.name, phone: updated.phone, profile: "profissional", userId: updated.id });
        return updated;
    }, [providerId]);

    const updateHourlyRate = useCallback(async (hourlyRate: number) => {
        if (!providerId) throw new Error("Profissional não identificado.");
        const response = await fetch(PROVIDER_API_ENDPOINTS.prestador(providerId), {
            body: JSON.stringify({ valor_hora: hourlyRate }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        if (!response.ok) throw new Error("Não foi possível atualizar o valor da hora.");
        const updated = mapProvider(await response.json() as ProviderApi);
        setProfile(updated);
        return updated;
    }, [providerId]);

    return { error, loading, profile, reload: () => setReloadKey((value) => value + 1), updateHourlyRate, updateProfile };
}
