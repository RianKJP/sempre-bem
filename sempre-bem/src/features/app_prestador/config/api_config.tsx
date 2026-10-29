import { API_BASE_URL } from "@/core/config/api_config";

export const PROVIDER_API_ENDPOINTS = {
    avaliacoes: `${API_BASE_URL}/avaliacao`,
    atendimentos: `${API_BASE_URL}/atendimento`,
    atendimento: (atendimentoId: string) =>
        `${API_BASE_URL}/atendimento/${encodeURIComponent(atendimentoId)}`,
    familias: `${API_BASE_URL}/familia`,
    idosos: `${API_BASE_URL}/idoso`,
    pagamentos: `${API_BASE_URL}/pagamento`,
    pagamento: (pagamentoId: string) =>
        `${API_BASE_URL}/pagamento/${encodeURIComponent(pagamentoId)}`,
    prestador: (prestadorId: string) =>
        `${API_BASE_URL}/cuidador/${encodeURIComponent(prestadorId)}`,
    solicitacao: (solicitacaoId: string) =>
        `${API_BASE_URL}/solicitacao_atendimento/${encodeURIComponent(solicitacaoId)}`,
    solicitacoes: `${API_BASE_URL}/solicitacao_atendimento`,
} as const;
