import { API_BASE_URL } from "@/core/config/api_config";

export const CLIENT_API_ENDPOINTS = {
    atendimentos: `${API_BASE_URL}/atendimento`,
    avaliacoes: `${API_BASE_URL}/avaliacao`,
    cuidadores: `${API_BASE_URL}/cuidador`,
    familia: (familiaId: string) =>
        `${API_BASE_URL}/familia/${encodeURIComponent(familiaId)}`,
    idososDaFamilia: (familiaId: string) => {
        const filtro = encodeURIComponent(
            JSON.stringify({ id_familia: { eq: familiaId } }),
        );

        return `${API_BASE_URL}/idoso?_where=${filtro}`;
    },
    idosos: `${API_BASE_URL}/idoso`,
    pagamentos: `${API_BASE_URL}/pagamento`,
    solicitacao: (solicitacaoId: string) =>
        `${API_BASE_URL}/solicitacao_atendimento/${encodeURIComponent(solicitacaoId)}`,
    solicitacoes: `${API_BASE_URL}/solicitacao_atendimento`,
    solicitacoesDaFamilia: (familiaId: string) => {
        const filtro = encodeURIComponent(
            JSON.stringify({ id_familia: { eq: familiaId } }),
        );

        return `${API_BASE_URL}/solicitacao_atendimento?_where=${filtro}`;
    },
} as const;
