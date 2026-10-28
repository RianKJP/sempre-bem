import { useRouter } from "expo-router";
import { useState } from "react";

import type { AuthProfile } from "@/features/autenticacao/service/auth_service";
import {
    clearAuthenticatedAccount,
    getAuthenticatedAccount,
} from "@/features/autenticacao/service/auth_session_repository";
import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export function useEscolherPerfilViewModel() {
    const router = useRouter();
    const [openingProfile, setOpeningProfile] = useState<AuthProfile>();

    async function openProfile(profile: AuthProfile) {
        if (openingProfile) {
            return;
        }

        setOpeningProfile(profile);

        let account = null;
        try {
            account = await getAuthenticatedAccount(profile);
        } catch {
            // Uma falha local não deve impedir o login convencional pela API.
        }

        if (account?.profile === "cliente") {
            try {
                const response = await fetch(CLIENT_API_ENDPOINTS.familia(account.userId));

                if (response.ok) {
                    setOpeningProfile(undefined);
                    router.replace({
                        pathname: "/cliente",
                        params: { familiaId: account.userId },
                    });
                    return;
                }

                if (response.status === 404) {
                    await clearAuthenticatedAccount("cliente");
                }
            } catch {
                // Sem confirmar a conta na API, o cliente deve autenticar novamente.
            }
        }

        if (account?.profile === "profissional") {
            setOpeningProfile(undefined);
            router.replace({
                pathname: "/cuidador",
                params: { prestadorId: account.userId },
            });
            return;
        }

        setOpeningProfile(undefined);
        router.push({ pathname: "/login", params: { perfil: profile } });
    }

    return {
        openCliente: () => openProfile("cliente"),
        openCuidador: () => openProfile("profissional"),
        openingProfile,
    };
}
