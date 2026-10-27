import { useRouter } from "expo-router";

export function useEscolherPerfilViewModel() {
    const router = useRouter();

    return {
        openCliente: () => router.push({ pathname: "/login", params: { perfil: "cliente" } }),
        openCuidador: () => router.push({ pathname: "/login", params: { perfil: "profissional" } }),
    };
}
