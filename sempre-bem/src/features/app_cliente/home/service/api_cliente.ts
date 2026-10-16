import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type FamiliaApi = {
    criado_em: string;
    email: string;
    id: string;
    id_familia: string;
    nome: string;
    senha: string;
};

export type IdosoApi = {
    data_nascimento: string;
    id: string;
    id_familia: string;
    id_idoso: string;
    nome: string;
    observacoes: string | null;
};

export type CuidadorApi = {
    criado_em: string;
    documentacao_validada: boolean;
    email: string;
    id: string;
    id_cuidador: string;
    latitude: number | null;
    longitude: number | null;
    nome: string;
    senha: string;
    status_disponibilidade: "DISPONIVEL" | "EM_ATENDIMENTO" | "INDISPONIVEL";
};

export type FamiliaComIdosos = {
    familia: FamiliaApi;
    idosos: IdosoApi[];
};

async function buscarJson<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(endpoint, { signal });

    if (!response.ok) {
        throw new Error(`Erro ${response.status} ao acessar ${endpoint}`);
    }

    return response.json() as Promise<T>;
}

export function buscarFamilia(
    familiaId: string,
    signal?: AbortSignal,
): Promise<FamiliaApi> {
    return buscarJson<FamiliaApi>(
        CLIENT_API_ENDPOINTS.familia(familiaId),
        signal,
    );
}

export function buscarIdososDaFamilia(
    familiaId: string,
    signal?: AbortSignal,
): Promise<IdosoApi[]> {
    return buscarJson<IdosoApi[]>(
        CLIENT_API_ENDPOINTS.idososDaFamilia(familiaId),
        signal,
    );
}

export async function buscarFamiliaComIdosos(
    familiaId: string,
    signal?: AbortSignal,
): Promise<FamiliaComIdosos> {
    const [familia, idosos] = await Promise.all([
        buscarFamilia(familiaId, signal),
        buscarIdososDaFamilia(familiaId, signal),
    ]);

    return { familia, idosos };
}

export async function buscarCuidadoresDisponiveis(
    signal?: AbortSignal,
): Promise<CuidadorApi[]> {
    const cuidadores = await buscarJson<CuidadorApi[]>(
        CLIENT_API_ENDPOINTS.cuidadores,
        signal,
    );

    return cuidadores.filter(
        (cuidador) =>
            cuidador.documentacao_validada &&
            cuidador.status_disponibilidade === "DISPONIVEL",
    );
}
