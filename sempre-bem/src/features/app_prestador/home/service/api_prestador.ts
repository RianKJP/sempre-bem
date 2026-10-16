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
    status_disponibilidade: "DISPONIVEL" | "EM_ATENDIMENTO" | "INDISPONIVEL";
};

export type ChamadoAtualPrestador = {
    address: string;
    caredPersonAge: number;
    dateLabel: string;
    duration: string;
    familyMember: string;
    id: string;
    requester: string;
    service: string;
    status: "EM_ATENDIMENTO" | "PENDENTE";
};

type SolicitacaoApi = {
    criado_em: string;
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
    id_solicitacao: string;
    status: "AGENDADO" | "CANCELADO" | "CONCLUIDO" | "EM_ANDAMENTO";
};

type FamiliaApi = {
    id_familia: string;
    nome: string;
};

type IdosoApi = {
    data_nascimento: string;
    id_idoso: string;
    nome: string;
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
                      solicitacao.status === "PENDENTE" && !solicitacao.id_cuidador,
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

    const familia = familias.find((item) => item.id_familia === solicitacao.id_familia);
    const idoso = idosos.find((item) => item.id_idoso === solicitacao.id_idoso);
    const requestDate = new Date(solicitacao.data_hora_solicitada);

    return {
        address: solicitacao.endereco_atendimento ?? "Endereço não informado",
        caredPersonAge: idoso ? calcularIdade(idoso.data_nascimento, requestDate) : 0,
        dateLabel: formatarDataDoChamado(requestDate),
        duration: solicitacao.duracao_horas
            ? `${solicitacao.duracao_horas} ${solicitacao.duracao_horas === 1 ? "hora" : "horas"}`
            : "Duração não informada",
        familyMember: idoso?.nome ?? "Familiar",
        id: solicitacao.id,
        requester: familia?.nome ?? "Família",
        service: solicitacao.servico ?? "Atendimento domiciliar",
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
