import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type PrestadorAceiteApi = {
    aceito_em: string;
    atendimentos_concluidos: number;
    id_cuidador: string;
    latitude: number | null;
    longitude: number | null;
    nome: string;
    nota_media: number | null;
    tipo_profissional: "CUIDADOR" | "ENFERMEIRO";
    status_candidatura: "CANDIDATO" | "CONTRATADO" | "NEGADO";
    valor_hora: number;
    valor_total: number;
};

export type SolicitacaoAtendimentoApi = {
    atendimento_ativo?: AtendimentoApi;
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
    latitude_atendimento: number | null;
    longitude_atendimento: number | null;
    prestador_contratado?: PrestadorAceiteApi;
    servico: string;
    status: "PENDENTE" | "ACEITA" | "CONTRATADO" | "CANCELADA";
};

export type TipoRegistroAtendimento =
    | "ALIMENTACAO"
    | "MEDICAMENTO"
    | "MENSAGEM_CHAT"
    | "OBSERVACAO"
    | "OUTRO";

export type RegistroAtendimentoApi = {
    autor_id: string;
    autor_tipo: "CLIENTE" | "PRESTADOR" | "SISTEMA";
    criado_em: string;
    dados?: Record<string, unknown>;
    descricao: string;
    id_registro: string;
    tipo: TipoRegistroAtendimento;
};

export type AtendimentoApi = {
    codigo_inicio: string;
    criado_em: string;
    data_hora_fim: string | null;
    data_hora_inicio: string | null;
    data_hora_prevista_fim?: string | null;
    duracao_horas: number;
    endereco_atendimento: string;
    forma_pagamento: "DINHEIRO" | "PIX";
    id?: string;
    id_atendimento: string;
    id_cuidador: string;
    id_familia: string;
    id_idoso: string;
    id_solicitacao: string;
    latitude_atendimento: number | null;
    longitude_atendimento: number | null;
    registros_diario: RegistroAtendimentoApi[];
    servicos: string[];
    status: "A_CAMINHO" | "CANCELADO_CLIENTE" | "CANCELADO_PRESTADOR" | "CONCLUIDO" | "EM_ANDAMENTO";
    valor_total: number;
};

export type CriarSolicitacaoInput = {
    duracaoHoras: number;
    enderecoAtendimento: string;
    formaPagamento: "DINHEIRO" | "PIX";
    id_familia: string;
    id_idoso: string;
    latitudeAtendimento: number | null;
    longitudeAtendimento: number | null;
    servico: string;
};

export type ContratarPrestadorInput = {
    formaPagamento: "DINHEIRO" | "PIX";
    prestador: PrestadorAceiteApi;
    solicitacao: SolicitacaoAtendimentoApi;
};

export type ContratacaoResultado = {
    codigoInicio: string;
    idAtendimento: string;
};

export type CriarRegistroAtendimentoInput = {
    autorId: string;
    autorTipo: RegistroAtendimentoApi["autor_tipo"];
    dados?: Record<string, unknown>;
    descricao: string;
    tipo: TipoRegistroAtendimento;
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
    const [solicitacoes, atendimentos] = await Promise.all([
        listarSolicitacoes(signal),
        listarColecao<AtendimentoApi>(CLIENT_API_ENDPOINTS.atendimentos, signal),
    ]);

    return solicitacoes
        .map((solicitacao) => {
            const atendimentoRelacionado = atendimentos.find((atendimento) =>
                String(atendimento.id_solicitacao) === String(solicitacao.id_solicitacao));
            const atendimentoAtivo = atendimentoRelacionado &&
                (atendimentoRelacionado.status === "A_CAMINHO" ||
                    atendimentoRelacionado.status === "EM_ANDAMENTO")
                ? atendimentoRelacionado
                : undefined;

            return {
                atendimentoAtivo,
                atendimentoRelacionado,
                solicitacao,
            };
        })
        .filter(({ atendimentoAtivo, atendimentoRelacionado, solicitacao }) => {
            if (String(solicitacao.id_familia) !== String(familiaId)) return false;
            if (solicitacao.status === "PENDENTE" || solicitacao.status === "ACEITA") {
                return !atendimentoRelacionado;
            }
            return solicitacao.status === "CONTRATADO" && Boolean(atendimentoAtivo);
        })
        .sort((first, second) =>
            Date.parse(second.solicitacao.data_hora_solicitada) -
            Date.parse(first.solicitacao.data_hora_solicitada))
        .map(({ atendimentoAtivo, solicitacao }) => ({
            ...solicitacao,
            atendimento_ativo: atendimentoAtivo,
        }))[0] ?? null;
}

export async function buscarAtendimentoDaSolicitacao(
    solicitacaoId: string,
    signal?: AbortSignal,
): Promise<AtendimentoApi | null> {
    const atendimentos = await listarColecao<AtendimentoApi>(CLIENT_API_ENDPOINTS.atendimentos, signal);
    return atendimentos.find(
        (atendimento) => String(atendimento.id_solicitacao) === String(solicitacaoId),
    ) ?? null;
}

export async function cancelarAtendimentoPeloCliente(atendimento: AtendimentoApi) {
    const atendimentoId = String(atendimento.id ?? atendimento.id_atendimento);
    const agora = new Date().toISOString();
    const [atendimentoResponse, pagamentos] = await Promise.all([
        fetch(CLIENT_API_ENDPOINTS.atendimento(atendimentoId), {
            body: JSON.stringify({
                cancelado_em: agora,
                cancelado_por: "CLIENTE",
                data_hora_fim: agora,
                status: "CANCELADO_CLIENTE",
            }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        }),
        listarColecao<ArrayRecord>(CLIENT_API_ENDPOINTS.pagamentos),
    ]);
    await validarResposta<AtendimentoApi>(atendimentoResponse);

    const pagamento = pagamentos.find(
        (item) => String(item.id_atendimento) === String(atendimento.id_atendimento),
    );
    if (pagamento) {
        const pagamentoId = String(pagamento.id ?? pagamento.id_pagamento);
        const response = await fetch(CLIENT_API_ENDPOINTS.pagamento(pagamentoId), {
            body: JSON.stringify({ data_reembolso: agora, status: "REEMBOLSADO" }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        await validarResposta<Record<string, unknown>>(response);
    }

    const cuidadorResponse = await fetch(CLIENT_API_ENDPOINTS.cuidador(atendimento.id_cuidador), {
        body: JSON.stringify({ status_disponibilidade: "DISPONIVEL" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    if (!cuidadorResponse.ok) throw new Error("Não foi possível liberar o profissional.");
}

export type FinalizarAtendimentoResultado = {
    atendimentoId: string;
    avaliacaoId: string;
};

export async function finalizarAtendimentoPeloCliente(
    atendimento: AtendimentoApi,
): Promise<FinalizarAtendimentoResultado> {
    const atendimentoId = String(atendimento.id ?? atendimento.id_atendimento);
    const endpoint = CLIENT_API_ENDPOINTS.atendimento(atendimentoId);
    const currentResponse = await fetch(endpoint);
    const current = await validarResposta<AtendimentoApi>(currentResponse);
    if (current.status !== "EM_ANDAMENTO") {
        throw new Error("Este atendimento não está em andamento.");
    }

    const agora = new Date().toISOString();
    const avaliacoes = await listarColecao<ArrayRecord>(CLIENT_API_ENDPOINTS.avaliacoes);
    let avaliacao = avaliacoes.find(
        (item) => String(item.id_atendimento) === String(current.id_atendimento),
    );
    let avaliacaoCriada = false;
    if (!avaliacao) {
        const evaluationResponse = await fetch(CLIENT_API_ENDPOINTS.avaliacoes, {
            body: JSON.stringify({
                avaliado_em: null,
                comentario: null,
                criado_em: agora,
                id_atendimento: current.id_atendimento,
                id_cuidador: current.id_cuidador,
                id_familia: current.id_familia,
                id_idoso: current.id_idoso,
                nota: null,
                status: "PENDENTE",
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });
        avaliacao = await validarResposta<ArrayRecord>(evaluationResponse);
        avaliacaoCriada = true;
    }
    const avaliacaoId = String(avaliacao.id ?? avaliacao.id_avaliacao);

    const finishResponse = await fetch(endpoint, {
        body: JSON.stringify({ data_hora_fim: agora, status: "CONCLUIDO" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    if (!finishResponse.ok) {
        if (avaliacaoCriada) await fetch(CLIENT_API_ENDPOINTS.avaliacao(avaliacaoId), { method: "DELETE" });
        throw new Error("Não foi possível concluir o atendimento.");
    }

    const providerResponse = await fetch(CLIENT_API_ENDPOINTS.cuidador(current.id_cuidador), {
        body: JSON.stringify({ status_disponibilidade: "DISPONIVEL" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    if (!providerResponse.ok) {
        await fetch(endpoint, {
            body: JSON.stringify({ data_hora_fim: null, status: "EM_ANDAMENTO" }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        if (avaliacaoCriada) await fetch(CLIENT_API_ENDPOINTS.avaliacao(avaliacaoId), { method: "DELETE" });
        throw new Error("Não foi possível liberar o profissional.");
    }
    return { atendimentoId, avaliacaoId };
}

type ArrayRecord = Record<string, unknown> & {
    id?: string;
    id_atendimento?: string;
    id_avaliacao?: string;
    id_pagamento?: string;
};

export async function registrarNoDiarioDoAtendimento(
    atendimentoId: string,
    input: CriarRegistroAtendimentoInput,
): Promise<AtendimentoApi> {
    const endpoint = CLIENT_API_ENDPOINTS.atendimento(atendimentoId);
    const atendimentoResponse = await fetch(endpoint);
    const atendimento = await validarResposta<AtendimentoApi>(atendimentoResponse);
    const registros = atendimento.registros_diario ?? [];
    const proximoId = registros.reduce((maiorId, registro) => {
        const id = Number(registro.id_registro);
        return Number.isFinite(id) ? Math.max(maiorId, id) : maiorId;
    }, 0) + 1;
    const novoRegistro: RegistroAtendimentoApi = {
        autor_id: input.autorId,
        autor_tipo: input.autorTipo,
        criado_em: new Date().toISOString(),
        dados: input.dados,
        descricao: input.descricao,
        id_registro: String(proximoId),
        tipo: input.tipo,
    };

    const response = await fetch(endpoint, {
        body: JSON.stringify({ registros_diario: [...registros, novoRegistro] }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    return validarResposta<AtendimentoApi>(response);
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
        latitude_atendimento: input.latitudeAtendimento,
        longitude_atendimento: input.longitudeAtendimento,
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

async function listarColecao<T>(endpoint: string, signal?: AbortSignal): Promise<T[]> {
    const response = await fetch(endpoint, { signal });
    return validarResposta<T[]>(response);
}

function obterProximoIdColecao(items: Array<Record<string, unknown>>, field: string) {
    const maiorId = items.reduce((current, item) => {
        const id = Number(item[field] ?? item.id);
        return Number.isFinite(id) ? Math.max(current, id) : current;
    }, 0);
    return String(maiorId + 1);
}

export async function contratarPrestador(
    input: ContratarPrestadorInput,
): Promise<ContratacaoResultado> {
    const currentRequest = await buscarSolicitacao(input.solicitacao.id);

    if (currentRequest.id_cuidador) {
        throw new Error("Este chamado já possui um profissional contratado.");
    }

    const [appointments, payments] = await Promise.all([
        listarColecao<Record<string, unknown>>(CLIENT_API_ENDPOINTS.atendimentos),
        listarColecao<Record<string, unknown>>(CLIENT_API_ENDPOINTS.pagamentos),
    ]);
    const idAtendimento = obterProximoIdColecao(appointments, "id_atendimento");
    const idPagamento = obterProximoIdColecao(payments, "id_pagamento");
    const codigoInicio = String(Math.floor(1000 + Math.random() * 9000));
    const now = new Date().toISOString();

    const requestResponse = await fetch(CLIENT_API_ENDPOINTS.solicitacao(currentRequest.id), {
        body: JSON.stringify({
            data_hora_resposta: now,
            id_cuidador: input.prestador.id_cuidador,
            prestador_contratado: { ...input.prestador, status_candidatura: "CONTRATADO" },
            cuidadores_aceitaram: (currentRequest.cuidadores_aceitaram ?? []).map((prestador) => ({
                ...prestador,
                status_candidatura: String(prestador.id_cuidador) === String(input.prestador.id_cuidador)
                    ? "CONTRATADO"
                    : "NEGADO",
            })),
            status: "CONTRATADO",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await validarResposta<SolicitacaoAtendimentoApi>(requestResponse);

    const appointmentResponse = await fetch(CLIENT_API_ENDPOINTS.atendimentos, {
        body: JSON.stringify({
            codigo_inicio: codigoInicio,
            criado_em: now,
            data_hora_fim: null,
            data_hora_inicio: null,
            duracao_horas: currentRequest.duracao_horas,
            endereco_atendimento: currentRequest.endereco_atendimento,
            forma_pagamento: input.formaPagamento,
            id_atendimento: idAtendimento,
            id_cuidador: input.prestador.id_cuidador,
            id_familia: currentRequest.id_familia,
            id_idoso: currentRequest.id_idoso,
            id_solicitacao: currentRequest.id_solicitacao,
            latitude_atendimento: currentRequest.latitude_atendimento,
            longitude_atendimento: currentRequest.longitude_atendimento,
            registros_diario: [],
            servicos: currentRequest.servico.split(",").map((servico) => servico.trim()).filter(Boolean),
            status: "A_CAMINHO",
            valor_total: input.prestador.valor_total,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
    const createdAppointment = await validarResposta<AtendimentoApi>(appointmentResponse);

    const paymentResponse = await fetch(CLIENT_API_ENDPOINTS.pagamentos, {
        body: JSON.stringify({
            criado_em: now,
            data_pagamento: input.formaPagamento === "PIX" ? now : null,
            forma_pagamento: input.formaPagamento,
            id_atendimento: idAtendimento,
            id_pagamento: idPagamento,
            status: input.formaPagamento === "PIX" ? "PAGO" : "PENDENTE",
            valor: input.prestador.valor_total,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
    await validarResposta<Record<string, unknown>>(paymentResponse);

    await fetch(CLIENT_API_ENDPOINTS.cuidador(input.prestador.id_cuidador), {
        body: JSON.stringify({ status_disponibilidade: "EM_ATENDIMENTO" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });

    return {
        codigoInicio,
        idAtendimento: String(createdAppointment.id ?? createdAppointment.id_atendimento),
    };
}
