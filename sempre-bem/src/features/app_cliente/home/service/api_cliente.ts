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
    relacao?: string | null;
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
    tipo_profissional?: "CUIDADOR" | "ENFERMEIRO";
    especialidades?: string[];
    tempo_experiencia?: string;
    formacao?: string;
    descricao_profissional?: string;
    status_disponibilidade: "DISPONIVEL" | "EM_ATENDIMENTO" | "INDISPONIVEL";
    valor_hora?: number | null;
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

export async function buscarIdososDaFamilia(
    familiaId: string,
    signal?: AbortSignal,
): Promise<IdosoApi[]> {
    let idosos: IdosoApi[] | undefined;
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            idosos = await buscarJson<IdosoApi[]>(
                CLIENT_API_ENDPOINTS.idosos,
                signal,
            );
            break;
        } catch (error) {
            if (signal?.aborted) throw error;
            lastError = error;

            if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
            }
        }
    }

    if (!idosos) {
        throw lastError instanceof Error
            ? lastError
            : new Error("Não foi possível carregar as pessoas cuidadas.");
    }

    return idosos.filter(
        (idoso) => String(idoso.id_familia) === String(familiaId),
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
        (cuidador) => cuidador.status_disponibilidade === "DISPONIVEL",
    );
}

export function buscarCuidador(
    cuidadorId: string,
    signal?: AbortSignal,
): Promise<CuidadorApi> {
    return buscarJson<CuidadorApi>(
        CLIENT_API_ENDPOINTS.cuidador(cuidadorId),
        signal,
    );
}
