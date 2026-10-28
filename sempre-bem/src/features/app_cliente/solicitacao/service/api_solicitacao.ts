import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type PrestadorAceiteApi = {
    aceito_em: string;
    id_cuidador: string;
    nome: string;
    tipo_profissional: "CUIDADOR" | "ENFERMEIRO";
    valor_hora: number;
    valor_total: number;
};

export type SolicitacaoAtendimentoApi = {
    cuidadores_aceitaram?: PrestadorAceiteApi[];
    criado_em: string;
    data_hora_resposta: string | null;
    data_hora_solicitada: string;
    duracao_horas: number;
    endereco_atendimento: string;
    forma_pagamento: "DINHEIRO" | "PIX";
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
    formaPagamento: "DINHEIRO" | "PIX";
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

async function listarSolicitacoes(signal?: AbortSignal): Promise<SolicitacaoAtendimentoApi[]> {
    const response = await fetch(CLIENT_API_ENDPOINTS.solicitacoes, { signal });

    return validarResposta<SolicitacaoAtendimentoApi[]>(response);
}

export async function buscarSolicitacao(
    solicitacaoId: string,
    signal?: AbortSignal,
): Promise<SolicitacaoAtendimentoApi> {
    const response = await fetch(
        CLIENT_API_ENDPOINTS.solicitacao(solicitacaoId),
        { signal },
    );

    return validarResposta<SolicitacaoAtendimentoApi>(response);
}

export async function buscarSolicitacaoPendenteDaFamilia(
    familiaId: string,
    signal?: AbortSignal,
): Promise<SolicitacaoAtendimentoApi | null> {
    const solicitacoes = await listarSolicitacoes(signal);

    return solicitacoes
        .filter((solicitacao) =>
            String(solicitacao.id_familia) === String(familiaId) &&
            (solicitacao.status === "PENDENTE" || solicitacao.status === "ACEITA"))
        .sort((first, second) =>
            Date.parse(second.data_hora_solicitada) - Date.parse(first.data_hora_solicitada))[0] ?? null;
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
        cuidadores_aceitaram: [],
        criado_em: agora,
        data_hora_resposta: null,
        data_hora_solicitada: agora,
        duracao_horas: input.duracaoHoras,
        endereco_atendimento: input.enderecoAtendimento,
        forma_pagamento: input.formaPagamento,
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
