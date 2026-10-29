import { API_BASE_URL } from "@/core/config/api_config";

export const CLIENT_API_ENDPOINTS = {
    atendimentos: `${API_BASE_URL}/atendimento`,
    atendimento: (atendimentoId: string) =>
        `${API_BASE_URL}/atendimento/${encodeURIComponent(atendimentoId)}`,
    avaliacoes: `${API_BASE_URL}/avaliacao`,
    avaliacao: (avaliacaoId: string) =>
        `${API_BASE_URL}/avaliacao/${encodeURIComponent(avaliacaoId)}`,
    cuidadores: `${API_BASE_URL}/cuidador`,
    cuidador: (cuidadorId: string) =>
        `${API_BASE_URL}/cuidador/${encodeURIComponent(cuidadorId)}`,
    familia: (familiaId: string) =>
        `${API_BASE_URL}/familia/${encodeURIComponent(familiaId)}`,
    idososDaFamilia: (familiaId: string) =>
        `${API_BASE_URL}/idoso?id_familia=${encodeURIComponent(familiaId)}`,
    idosos: `${API_BASE_URL}/idoso`,
    idoso: (idosoId: string) =>
        `${API_BASE_URL}/idoso/${encodeURIComponent(idosoId)}`,
    pagamentos: `${API_BASE_URL}/pagamento`,
    pagamento: (pagamentoId: string) =>
        `${API_BASE_URL}/pagamento/${encodeURIComponent(pagamentoId)}`,
    solicitacao: (solicitacaoId: string) =>
        `${API_BASE_URL}/solicitacao_atendimento/${encodeURIComponent(solicitacaoId)}`,
    solicitacoes: `${API_BASE_URL}/solicitacao_atendimento`,
    solicitacoesDaFamilia: (familiaId: string) =>
        `${API_BASE_URL}/solicitacao_atendimento?id_familia=${encodeURIComponent(familiaId)}`,
} as const;
