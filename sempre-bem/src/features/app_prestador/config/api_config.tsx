import { API_BASE_URL } from "@/core/config/api_config";

export const PROVIDER_API_ENDPOINTS = {
    atendimentos: `${API_BASE_URL}/atendimento`,
    familias: `${API_BASE_URL}/familia`,
    idosos: `${API_BASE_URL}/idoso`,
    prestador: (prestadorId: string) =>
        `${API_BASE_URL}/cuidador/${encodeURIComponent(prestadorId)}`,
    solicitacoes: `${API_BASE_URL}/solicitacao_atendimento`,
} as const;
