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
    caredPersonAge: number;
    dateLabel: string;
    duration: string;
    durationHours: number;
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
    status: "EM_ATENDIMENTO" | "PENDENTE";
};

type SolicitacaoApi = {
    cuidadores_aceitaram?: Array<{
        aceito_em: string;
        id_cuidador: string;
        nome: string;
        tipo_profissional: "CUIDADOR" | "ENFERMEIRO";
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
    servico?: string;
    status: "ACEITA" | "CANCELADA" | "PENDENTE";
};

type AtendimentoApi = {
    id?: string;
    id_atendimento: string;
    id_solicitacao: string;
    criado_em?: string;
    data_hora_fim?: string | null;
    data_hora_inicio?: string | null;
    status: "AGENDADO" | "CANCELADO" | "CONCLUIDO" | "EM_ANDAMENTO";
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
    const solicitacaoEmAndamento = solicitacoes.find(
        (solicitacao) =>
            solicitacao.id_cuidador === prestador.id_cuidador &&
            atendimentos.some(
                (atendimento) =>
                    atendimento.id_solicitacao === solicitacao.id_solicitacao &&
                    atendimento.status === "EM_ANDAMENTO",
            ),
    );

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
    const solicitacao = solicitacaoEmAndamento ?? solicitacaoPendente;

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
        caredPersonAge: idoso ? calcularIdade(idoso.data_nascimento, requestDate) : 0,
        dateLabel: formatarDataDoChamado(requestDate),
        duration: durationHours
            ? `${durationHours} ${durationHours === 1 ? "hora" : "horas"}`
            : "Duração não informada",
        durationHours,
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
        status: solicitacaoEmAndamento ? "EM_ATENDIMENTO" : "PENDENTE",
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

    const acceptedAt = new Date().toISOString();
    const response = await fetch(PROVIDER_API_ENDPOINTS.solicitacao(chamado.id), {
        body: JSON.stringify({
            cuidadores_aceitaram: [
                ...acceptedProviders,
                {
                    aceito_em: acceptedAt,
                    id_cuidador: prestador.id_cuidador,
                    nome: prestador.nome,
                    tipo_profissional: prestador.tipo_profissional ?? "CUIDADOR",
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
