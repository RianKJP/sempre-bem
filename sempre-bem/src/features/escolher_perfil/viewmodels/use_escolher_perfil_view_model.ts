import { useRouter } from "expo-router";
import { useState } from "react";

import type { AuthProfile } from "@/features/autenticacao/service/auth_service";
import { getAuthenticatedAccount } from "@/features/autenticacao/service/auth_session_repository";

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

        setOpeningProfile(undefined);

        if (account?.profile === "cliente") {
            router.replace({
                pathname: "/cliente",
                params: { familiaId: account.userId },
            });
            return;
        }

        if (account?.profile === "profissional") {
            router.replace({
                pathname: "/cuidador",
                params: { prestadorId: account.userId },
            });
            return;
        }

        router.push({ pathname: "/login", params: { perfil: profile } });
    }

    return {
        openCliente: () => openProfile("cliente"),
        openCuidador: () => openProfile("profissional"),
        openingProfile,
    };
}
