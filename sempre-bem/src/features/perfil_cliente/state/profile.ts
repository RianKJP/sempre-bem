import { useCallback, useEffect, useState } from "react";

import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";
import {
    getAuthenticatedAccount,
    saveAuthenticatedAccount,
} from "@/features/autenticacao/service/auth_session_repository";

export type ClienteProfile = {
    email: string;
    id: string;
    name: string;
    phone: string;
};
export type ClienteProfileInput = Pick<ClienteProfile, "name" | "email">;
export type ProfileErrors = Partial<Record<keyof ClienteProfileInput, string>>;

type FamiliaApi = {
    email: string;
    id: string;
    id_familia?: string;
    nome: string;
    telefone?: string;
};

export function validateProfile(input: ClienteProfileInput): ProfileErrors {
    const errors: ProfileErrors = {};
    if (input.name.trim().split(/\s+/).filter(Boolean).length < 2) {
        errors.name = "Informe seu nome completo.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
        errors.email = "Informe um e-mail válido.";
    }
    return errors;
}

function mapFamily(family: FamiliaApi): ClienteProfile {
    return {
        email: family.email,
        id: family.id_familia ?? family.id,
        name: family.nome,
        phone: family.telefone ?? "",
    };
}

export function useClienteProfile(familyId?: string) {
    const [profile, setProfile] = useState<ClienteProfile>();
    const [loading, setLoading] = useState(Boolean(familyId));
    const [error, setError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        if (!familyId) {
            setProfile(undefined);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let active = true;
        setLoading(true);
        setError(undefined);

        void (async () => {
            let hasLocalProfile = false;

            try {
                const account = await getAuthenticatedAccount("cliente");
                if (account?.userId === familyId && active) {
                    hasLocalProfile = true;
                    setProfile({
                        email: account.email,
                        id: account.userId,
                        name: account.name,
                        phone: account.phone ?? "",
                    });
                    setLoading(false);
                }
            } catch {
                // O perfil ainda pode ser carregado normalmente pela API.
            }

            try {
                const response = await fetch(
                    CLIENT_API_ENDPOINTS.familia(familyId),
                    { signal: controller.signal },
                );
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                const updated = mapFamily(await response.json() as FamiliaApi);
                if (!active) return;
                setProfile(updated);
                try {
                    await saveAuthenticatedAccount({
                        email: updated.email,
                        name: updated.name,
                        phone: updated.phone,
                        profile: "cliente",
                        userId: updated.id,
                    });
                } catch {
                    // A falha ao atualizar o cache não invalida os dados recebidos da API.
                }
            } catch (failure) {
                if (failure instanceof Error && failure.name === "AbortError") return;
                if (!hasLocalProfile && active) {
                    setError("Não foi possível carregar o perfil do cliente.");
                }
            } finally {
                if (active) setLoading(false);
            }
        })();

        return () => {
            active = false;
            controller.abort();
        };
    }, [familyId, reloadKey]);

    const updateProfile = useCallback(async (input: ClienteProfileInput) => {
        if (!familyId) throw new Error("Cliente não identificado.");

        const response = await fetch(CLIENT_API_ENDPOINTS.familia(familyId), {
            body: JSON.stringify({
                email: input.email.trim().toLocaleLowerCase("pt-BR"),
                nome: input.name.trim(),
            }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        if (!response.ok) throw new Error("Não foi possível atualizar o perfil.");

        const updated = mapFamily(await response.json() as FamiliaApi);
        setProfile(updated);
        await saveAuthenticatedAccount({
            email: updated.email,
            name: updated.name,
            phone: updated.phone,
            profile: "cliente",
            userId: updated.id,
        });
        return updated;
    }, [familyId]);

    return {
        error,
        loading,
        profile,
        reload: () => setReloadKey((value) => value + 1),
        updateProfile,
    };
}
