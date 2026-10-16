import { useRouter } from "expo-router";

export function useEscolherPerfilViewModel() {
    const router = useRouter();

    return {
        openCliente: () => router.replace("/cliente"),
        openCuidador: () => router.replace("/cuidador"),
    };
}
