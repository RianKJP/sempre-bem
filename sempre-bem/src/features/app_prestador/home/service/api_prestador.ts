import { PROVIDER_API_ENDPOINTS } from "@/features/app_prestador/config/api_config";

export type PrestadorApi = {
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

export type ChamadoAtualPrestador = {
    address: string;
    allergies: string | null;
    appointmentId: string | null;
    caredPersonAge: number;
    dateLabel: string;
    destinationLatitude: number | null;
    destinationLongitude: number | null;
    duration: string;
    durationHours: number;
    endTime: string | null;
    expectedEarnings: number;
    familyMember: string;
    healthConditions: string | null;
    id: string;
    mobility: string | null;
    requester: string;
    restrictions: string | null;
    service: string;
    services: string[];
    sex: string | null;
    solicitationId: string;
    startTime: string | null;
    status: "A_CAMINHO" | "AGUARDANDO_CLIENTE" | "EM_ATENDIMENTO" | "PENDENTE";
};

type SolicitacaoApi = {
    cuidadores_aceitaram?: Array<{
        aceito_em: string;
        atendimentos_concluidos: number;
        id_cuidador: string;
        latitude: number | null;
        longitude: number | null;
        nome: string;
        nota_media: number | null;
        tipo_profissional: "CUIDADOR" | "ENFERMEIRO";
        status_candidatura?: "CANDIDATO" | "CONTRATADO" | "NEGADO";
        valor_hora: number;
        valor_total: number;
    }>;
    criado_em: string;
    data_hora_resposta?: string | null;
    data_hora_solicitada: string;
    duracao_horas?: number;
    endereco_atendimento?: string;
    id: string;
    id_cuidador: string | null;
    id_familia: string;
    id_idoso: string;
    id_solicitacao: string;
    latitude_atendimento?: number | null;
    longitude_atendimento?: number | null;
    servico?: string;
    status: "ACEITA" | "CANCELADA" | "CONTRATADO" | "PENDENTE";
};

type AtendimentoApi = {
    criado_em?: string;
    id_cuidador?: string;
    id_familia?: string;
    id_idoso?: string;
    codigo_inicio?: string;
    id?: string;
    id_atendimento: string;
    id_solicitacao: string;
    data_hora_fim?: string | null;
    data_hora_inicio?: string | null;
    data_hora_prevista_fim?: string | null;
    duracao_horas?: number;
    latitude_atendimento?: number | null;
    longitude_atendimento?: number | null;
    status: "A_CAMINHO" | "CANCELADO_CLIENTE" | "CANCELADO_PRESTADOR" | "CONCLUIDO" | "EM_ANDAMENTO";
};

type AvaliacaoApi = {
    id_atendimento: string;
    nota: number;
};

type FamiliaApi = {
    id_familia: string;
    nome: string;
};

type IdosoApi = {
    alergias?: string | null;
    condicoes_saude?: string | null;
    data_nascimento: string;
    id_idoso: string;
    mobilidade?: string | null;
    nome: string;
    restricoes?: string | null;
    sexo?: string | null;
};

export type DadosHomePrestador = {
    chamadoAtual: ChamadoAtualPrestador | null;
    prestador: PrestadorApi;
};

async function validarResposta<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`Erro ${response.status} ao acessar ${response.url}`);
    }

    return response.json() as Promise<T>;
}

export async function buscarPrestador(
    prestadorId: string,
    signal?: AbortSignal,
): Promise<PrestadorApi> {
    const response = await fetch(
        PROVIDER_API_ENDPOINTS.prestador(prestadorId),
        { signal },
    );

    return validarResposta<PrestadorApi>(response);
}

async function buscarLista<T>(endpoint: string, signal?: AbortSignal): Promise<T[]> {
    const response = await fetch(endpoint, { signal });
    return validarResposta<T[]>(response);
}

export async function buscarDadosHomePrestador(
    prestadorId: string,
    signal?: AbortSignal,
): Promise<DadosHomePrestador> {
    const [prestador, solicitacoes, atendimentos, familias, idosos] = await Promise.all([
        buscarPrestador(prestadorId, signal),
        buscarLista<SolicitacaoApi>(PROVIDER_API_ENDPOINTS.solicitacoes, signal),
        buscarLista<AtendimentoApi>(PROVIDER_API_ENDPOINTS.atendimentos, signal),
        buscarLista<FamiliaApi>(PROVIDER_API_ENDPOINTS.familias, signal),
        buscarLista<IdosoApi>(PROVIDER_API_ENDPOINTS.idosos, signal),
    ]);

    return {
        chamadoAtual: encontrarChamadoAtual(
            prestador,
            solicitacoes,
            atendimentos,
            familias,
            idosos,
        ),
        prestador,
    };
}

function encontrarChamadoAtual(
    prestador: PrestadorApi,
    solicitacoes: SolicitacaoApi[],
    atendimentos: AtendimentoApi[],
    familias: FamiliaApi[],
    idosos: IdosoApi[],
): ChamadoAtualPrestador | null {
    const atendimentoAtual = atendimentos
        .filter((atendimento) =>
            String(atendimento.id_cuidador) === String(prestador.id_cuidador) &&
            (atendimento.status === "A_CAMINHO" || atendimento.status === "EM_ANDAMENTO"),
        )
        .sort((first, second) =>
            Date.parse(second.criado_em ?? "") - Date.parse(first.criado_em ?? ""))[0];
    const solicitacaoDoAtendimento = atendimentoAtual
        ? solicitacoes.find((solicitacao) =>
              String(solicitacao.id_solicitacao) === String(atendimentoAtual.id_solicitacao))
        : undefined;

    const solicitacaoEmAnalise = solicitacoes
        .filter((solicitacao) => {
            if (solicitacao.status !== "PENDENTE" && solicitacao.status !== "ACEITA") {
                return false;
            }

            const candidatura = solicitacao.cuidadores_aceitaram?.find(
                (aceite) => String(aceite.id_cuidador) === String(prestador.id_cuidador),
            );

            return Boolean(
                candidatura &&
                (!candidatura.status_candidatura || candidatura.status_candidatura === "CANDIDATO"),
            );
        })
        .sort((first, second) =>
            Date.parse(second.criado_em) - Date.parse(first.criado_em))[0];

    const solicitacaoPendente = prestador.status_disponibilidade === "DISPONIVEL"
        ? solicitacoes
              .filter(
                  (solicitacao) =>
                      (solicitacao.status === "PENDENTE" || solicitacao.status === "ACEITA") &&
                      !solicitacao.id_cuidador &&
                      !solicitacao.cuidadores_aceitaram?.some(
                          (aceite) => String(aceite.id_cuidador) === String(prestador.id_cuidador),
                      ),
              )
              .sort(
                  (a, b) =>
                      new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
              )[0]
        : undefined;
    const solicitacao = solicitacaoDoAtendimento ?? solicitacaoEmAnalise ?? solicitacaoPendente;

    if (!solicitacao) {
        return null;
    }

    const familia = familias.find(
        (item) => String(item.id_familia) === String(solicitacao.id_familia),
    );
    const idoso = idosos.find(
        (item) => String(item.id_idoso) === String(solicitacao.id_idoso),
    );
    const requestDate = new Date(solicitacao.data_hora_solicitada);
    const service = solicitacao.servico?.trim() || "Atendimento domiciliar";
    const durationHours = solicitacao.duracao_horas ?? 0;

    return {
        address: solicitacao.endereco_atendimento ?? "Endereço não informado",
        allergies: idoso?.alergias?.trim() || null,
        appointmentId: atendimentoAtual
            ? String(atendimentoAtual.id ?? atendimentoAtual.id_atendimento)
            : null,
        caredPersonAge: idoso ? calcularIdade(idoso.data_nascimento, requestDate) : 0,
        dateLabel: formatarDataDoChamado(requestDate),
        destinationLatitude: atendimentoAtual?.latitude_atendimento ?? solicitacao.latitude_atendimento ?? null,
        destinationLongitude: atendimentoAtual?.longitude_atendimento ?? solicitacao.longitude_atendimento ?? null,
        duration: durationHours
            ? `${durationHours} ${durationHours === 1 ? "hora" : "horas"}`
            : "Duração não informada",
        durationHours,
        endTime: atendimentoAtual?.data_hora_prevista_fim ?? null,
        expectedEarnings: durationHours * (prestador.valor_hora ?? 0),
        familyMember: idoso?.nome ?? "Familiar",
        healthConditions: idoso?.condicoes_saude?.trim() || null,
        id: solicitacao.id,
        mobility: idoso?.mobilidade?.trim() || null,
        requester: familia?.nome ?? "Família",
        restrictions: idoso?.restricoes?.trim() || null,
        service,
        services: service.split(",").map((item) => item.trim()).filter(Boolean),
        sex: idoso?.sexo?.trim() || null,
        solicitationId: solicitacao.id_solicitacao,
        startTime: atendimentoAtual?.data_hora_inicio ?? null,
        status: atendimentoAtual?.status === "EM_ANDAMENTO"
            ? "EM_ATENDIMENTO"
            : atendimentoAtual?.status === "A_CAMINHO"
                ? "A_CAMINHO"
                : solicitacaoEmAnalise?.id === solicitacao.id
                    ? "AGUARDANDO_CLIENTE"
                    : "PENDENTE",
    };
}

function formatarDataDoChamado(date: Date) {
    const today = new Date();
    const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    const time = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);

    if (isToday) {
        return `Hoje, ${time}`;
    }

    const day = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
    }).format(date);
    return `${day}, ${time}`;
}

function calcularIdade(birthDateValue: string, referenceDate: Date) {
    const [year, month, day] = birthDateValue.split("-").map(Number);
    let age = referenceDate.getFullYear() - year;

    if (
        referenceDate.getMonth() + 1 < month ||
        (referenceDate.getMonth() + 1 === month && referenceDate.getDate() < day)
    ) {
        age -= 1;
    }

    return age;
}

export async function aceitarChamadoPrestador(
    chamado: ChamadoAtualPrestador,
    prestador: PrestadorApi,
): Promise<void> {
    const requestResponse = await fetch(PROVIDER_API_ENDPOINTS.solicitacao(chamado.id));
    const currentRequest = await validarResposta<SolicitacaoApi>(requestResponse);
    const acceptedProviders = currentRequest.cuidadores_aceitaram ?? [];

    if (currentRequest.status !== "PENDENTE" && currentRequest.status !== "ACEITA") {
        throw new Error("Este chamado não está mais disponível.");
    }

    if (acceptedProviders.some(
        (acceptedProvider) =>
            String(acceptedProvider.id_cuidador) === String(prestador.id_cuidador),
    )) {
        throw new Error("Você já aceitou este chamado.");
    }

    const [requests, appointments, evaluations] = await Promise.all([
        buscarLista<SolicitacaoApi>(PROVIDER_API_ENDPOINTS.solicitacoes),
        buscarLista<AtendimentoApi>(PROVIDER_API_ENDPOINTS.atendimentos),
        buscarLista<AvaliacaoApi>(PROVIDER_API_ENDPOINTS.avaliacoes),
    ]);
    const providerRequestIds = new Set(
        requests
            .filter((request) => String(request.id_cuidador) === String(prestador.id_cuidador))
            .map((request) => String(request.id_solicitacao)),
    );
    const completedAppointments = appointments.filter(
        (appointment) =>
            appointment.status === "CONCLUIDO" &&
            providerRequestIds.has(String(appointment.id_solicitacao)),
    );
    const completedAppointmentIds = new Set(
        completedAppointments.map((appointment) => String(appointment.id_atendimento || appointment.id)),
    );
    const providerRatings = evaluations
        .filter((evaluation) => completedAppointmentIds.has(String(evaluation.id_atendimento)))
        .map((evaluation) => Number(evaluation.nota))
        .filter(Number.isFinite);
    const averageRating = providerRatings.length
        ? providerRatings.reduce((total, rating) => total + rating, 0) / providerRatings.length
        : null;
    const acceptedAt = new Date().toISOString();
    const response = await fetch(PROVIDER_API_ENDPOINTS.solicitacao(chamado.id), {
        body: JSON.stringify({
            cuidadores_aceitaram: [
                ...acceptedProviders,
                {
                    aceito_em: acceptedAt,
                    atendimentos_concluidos: completedAppointments.length,
                    id_cuidador: prestador.id_cuidador,
                    latitude: prestador.latitude,
                    longitude: prestador.longitude,
                    nome: prestador.nome,
                    nota_media: averageRating,
                    tipo_profissional: prestador.tipo_profissional ?? "CUIDADOR",
                    status_candidatura: "CANDIDATO",
                    valor_hora: prestador.valor_hora ?? 0,
                    valor_total: chamado.expectedEarnings,
                },
            ],
            data_hora_resposta: currentRequest.data_hora_resposta ?? acceptedAt,
            status: "ACEITA",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });

    await validarResposta<SolicitacaoApi>(response);
}

export async function atualizarDisponibilidadePrestador(
    prestadorId: string,
    disponivel: boolean,
): Promise<PrestadorApi> {
    const response = await fetch(
        PROVIDER_API_ENDPOINTS.prestador(prestadorId),
        {
            body: JSON.stringify({
                status_disponibilidade: disponivel
                    ? "DISPONIVEL"
                    : "INDISPONIVEL",
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "PATCH",
        },
    );

    return validarResposta<PrestadorApi>(response);
}

export async function iniciarAtendimentoPrestador(
    atendimentoId: string,
    codigoInformado: string,
): Promise<void> {
    const endpoint = PROVIDER_API_ENDPOINTS.atendimento(atendimentoId);
    const currentResponse = await fetch(endpoint);
    const atendimento = await validarResposta<AtendimentoApi>(currentResponse);

    if (atendimento.status !== "A_CAMINHO") {
        throw new Error("Este atendimento não está aguardando início.");
    }
    if (String(atendimento.codigo_inicio) !== codigoInformado.trim()) {
        throw new Error("Código de início inválido.");
    }

    const inicio = new Date();
    const fimPrevisto = new Date(
        inicio.getTime() + (atendimento.duracao_horas ?? 0) * 60 * 60 * 1000,
    );
    const response = await fetch(endpoint, {
        body: JSON.stringify({
            data_hora_inicio: inicio.toISOString(),
            data_hora_prevista_fim: fimPrevisto.toISOString(),
            status: "EM_ANDAMENTO",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await validarResposta<AtendimentoApi>(response);
}

export async function cancelarAtendimentoPrestador(
    chamado: ChamadoAtualPrestador,
    prestador: PrestadorApi,
): Promise<void> {
    if (!chamado.appointmentId) throw new Error("Atendimento não encontrado.");
    const endpoint = PROVIDER_API_ENDPOINTS.atendimento(chamado.appointmentId);
    const currentResponse = await fetch(endpoint);
    const atendimento = await validarResposta<AtendimentoApi>(currentResponse);
    if (atendimento.status !== "A_CAMINHO" && atendimento.status !== "EM_ANDAMENTO") {
        throw new Error("Este atendimento não pode mais ser cancelado.");
    }

    const agora = new Date().toISOString();
    const [cancelResponse, pagamentos] = await Promise.all([
        fetch(endpoint, {
            body: JSON.stringify({
                cancelado_em: agora,
                cancelado_por: "PRESTADOR",
                data_hora_fim: agora,
                status: "CANCELADO_PRESTADOR",
            }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        }),
        buscarLista<Record<string, unknown>>(PROVIDER_API_ENDPOINTS.pagamentos),
    ]);
    await validarResposta<AtendimentoApi>(cancelResponse);

    const pagamento = pagamentos.find(
        (item) => String(item.id_atendimento) === String(atendimento.id_atendimento),
    );
    if (pagamento) {
        const pagamentoId = String(pagamento.id ?? pagamento.id_pagamento);
        const response = await fetch(PROVIDER_API_ENDPOINTS.pagamento(pagamentoId), {
            body: JSON.stringify({ data_reembolso: agora, status: "REEMBOLSADO" }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        });
        await validarResposta<Record<string, unknown>>(response);
    }

    const providerResponse = await fetch(PROVIDER_API_ENDPOINTS.prestador(prestador.id_cuidador), {
        body: JSON.stringify({ status_disponibilidade: "DISPONIVEL" }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await validarResposta<PrestadorApi>(providerResponse);
}

export async function atualizarValorHoraPrestador(
    prestadorId: string,
    valorHora: number,
): Promise<PrestadorApi> {
    const response = await fetch(
        PROVIDER_API_ENDPOINTS.prestador(prestadorId),
        {
            body: JSON.stringify({ valor_hora: valorHora }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        },
    );

    return validarResposta<PrestadorApi>(response);
}
