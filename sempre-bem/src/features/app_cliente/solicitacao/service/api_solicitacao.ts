import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type SolicitacaoAtendimentoApi = {
    criado_em: string;
    data_hora_resposta: string | null;
    data_hora_solicitada: string;
    duracao_horas: number;
    endereco_atendimento: string;
    id: string;
    id_cuidador: string | null;
    id_familia: string;
    id_idoso: string;
    id_solicitacao: string;
    servico: string;
    status: "PENDENTE" | "ACEITA" | "CANCELADA";
};

export type CriarSolicitacaoInput = {
    duracaoHoras: number;
    enderecoAtendimento: string;
    id_familia: string;
    id_idoso: string;
    servico: string;
};

async function validarResposta<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`Erro ${response.status} ao acessar ${response.url}`);
    }

    return response.json() as Promise<T>;
}

async function listarSolicitacoes(): Promise<SolicitacaoAtendimentoApi[]> {
    const response = await fetch(CLIENT_API_ENDPOINTS.solicitacoes);

    return validarResposta<SolicitacaoAtendimentoApi[]>(response);
}

function obterProximoId(solicitacoes: SolicitacaoAtendimentoApi[]) {
    const maiorId = solicitacoes.reduce((current, solicitacao) => {
        const id = Number(solicitacao.id_solicitacao || solicitacao.id);

        return Number.isFinite(id) ? Math.max(current, id) : current;
    }, 0);

    return String(maiorId + 1);
}

export async function criarSolicitacao(
    input: CriarSolicitacaoInput,
): Promise<SolicitacaoAtendimentoApi> {
    const solicitacoes = await listarSolicitacoes();
    const idSolicitacao = obterProximoId(solicitacoes);
    const agora = new Date().toISOString();
    const novaSolicitacao: Omit<SolicitacaoAtendimentoApi, "id"> = {
        criado_em: agora,
        data_hora_resposta: null,
        data_hora_solicitada: agora,
        duracao_horas: input.duracaoHoras,
        endereco_atendimento: input.enderecoAtendimento,
        id_cuidador: null,
        id_familia: input.id_familia,
        id_idoso: input.id_idoso,
        id_solicitacao: idSolicitacao,
        servico: input.servico,
        status: "PENDENTE",
    };

    const response = await fetch(CLIENT_API_ENDPOINTS.solicitacoes, {
        body: JSON.stringify(novaSolicitacao),
        headers: {
            "Content-Type": "application/json",
        },
        method: "POST",
    });

    return validarResposta<SolicitacaoAtendimentoApi>(response);
}

export async function cancelarSolicitacao(
    solicitacaoId: string,
): Promise<SolicitacaoAtendimentoApi> {
    const response = await fetch(CLIENT_API_ENDPOINTS.solicitacao(solicitacaoId), {
        body: JSON.stringify({
            data_hora_resposta: new Date().toISOString(),
            status: "CANCELADA",
        }),
        headers: {
            "Content-Type": "application/json",
        },
        method: "PATCH",
    });

    return validarResposta<SolicitacaoAtendimentoApi>(response);
}
