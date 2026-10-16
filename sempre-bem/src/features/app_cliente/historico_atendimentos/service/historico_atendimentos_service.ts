import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type AppointmentStatus =
    | "accepted"
    | "cancelled"
    | "completed"
    | "in_progress"
    | "pending";

export type AppointmentHistoryItem = {
    address: string;
    caregiver: string;
    caredPersonAge: number;
    date: string;
    dateLabel: string;
    duration: string;
    durationInMinutes: number;
    familyMember: string;
    id: string;
    month: string;
    price: string;
    rating: string;
    service: string;
    status: AppointmentStatus;
    time: string;
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
    data_hora_fim: string | null;
    data_hora_inicio: string | null;
    id: string;
    id_atendimento: string;
    id_solicitacao: string;
    status: "AGENDADO" | "CANCELADO" | "CONCLUIDO" | "EM_ANDAMENTO";
};

type IdosoApi = {
    data_nascimento: string;
    id_idoso: string;
    nome: string;
};

type CuidadorApi = {
    id_cuidador: string;
    nome: string;
};

type PagamentoApi = {
    id_atendimento: string;
    valor: number;
};

type AvaliacaoApi = {
    id_atendimento: string;
    nota: number;
};

type HistoryApiData = {
    atendimentos: AtendimentoApi[];
    avaliacoes: AvaliacaoApi[];
    cuidadores: CuidadorApi[];
    idosos: IdosoApi[];
    pagamentos: PagamentoApi[];
    solicitacoes: SolicitacaoApi[];
};

async function buscarJson<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(endpoint, { signal });

    if (!response.ok) {
        throw new Error(`Erro ${response.status} ao acessar ${endpoint}`);
    }

    return response.json() as Promise<T>;
}

async function buscarDadosDoHistorico(
    familiaId: string,
    signal?: AbortSignal,
): Promise<HistoryApiData> {
    const [solicitacoes, atendimentos, idosos, cuidadores, pagamentos, avaliacoes] =
        await Promise.all([
            buscarJson<SolicitacaoApi[]>(
                CLIENT_API_ENDPOINTS.solicitacoesDaFamilia(familiaId),
                signal,
            ),
            buscarJson<AtendimentoApi[]>(CLIENT_API_ENDPOINTS.atendimentos, signal),
            buscarJson<IdosoApi[]>(CLIENT_API_ENDPOINTS.idosos, signal),
            buscarJson<CuidadorApi[]>(CLIENT_API_ENDPOINTS.cuidadores, signal),
            buscarJson<PagamentoApi[]>(CLIENT_API_ENDPOINTS.pagamentos, signal),
            buscarJson<AvaliacaoApi[]>(CLIENT_API_ENDPOINTS.avaliacoes, signal),
        ]);

    return { atendimentos, avaliacoes, cuidadores, idosos, pagamentos, solicitacoes };
}

export async function listAppointmentHistory(
    familiaId: string,
    signal?: AbortSignal,
): Promise<AppointmentHistoryItem[]> {
    const data = await buscarDadosDoHistorico(familiaId, signal);
    return data.solicitacoes
        .map((solicitacao) => {
            const atendimento = data.atendimentos.find(
                (item) => item.id_solicitacao === solicitacao.id_solicitacao,
            );

            return montarItemDoHistorico(solicitacao, atendimento, data);
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(({ timestamp: _timestamp, ...appointment }) => appointment);
}

export async function getAppointmentHistoryById(
    id: string,
    familiaId: string,
    signal?: AbortSignal,
) {
    const appointments = await listAppointmentHistory(familiaId, signal);
    return appointments.find((appointment) => appointment.id === id);
}

function montarItemDoHistorico(
    solicitacao: SolicitacaoApi,
    atendimento: AtendimentoApi | undefined,
    data: HistoryApiData,
): AppointmentHistoryItem & { timestamp: number } {
    const dateValue = atendimento?.data_hora_inicio ?? solicitacao.data_hora_solicitada;
    const date = new Date(dateValue);
    const idAtendimento = atendimento?.id_atendimento || atendimento?.id;
    const idoso = data.idosos.find((item) => item.id_idoso === solicitacao.id_idoso);
    const cuidador = data.cuidadores.find((item) => item.id_cuidador === solicitacao.id_cuidador);
    const pagamento = idAtendimento
        ? data.pagamentos.find((item) => item.id_atendimento === idAtendimento)
        : undefined;
    const avaliacao = idAtendimento
        ? data.avaliacoes.find((item) => item.id_atendimento === idAtendimento)
        : undefined;
    const actualDurationInMinutes = calcularDuracaoEmMinutos(
        atendimento?.data_hora_inicio ?? null,
        atendimento?.data_hora_fim ?? null,
    );
    const durationInMinutes = actualDurationInMinutes || (solicitacao.duracao_horas ?? 0) * 60;

    return {
        address: solicitacao.endereco_atendimento ?? "Endereço não informado",
        caregiver: cuidador?.nome ?? "Aguardando profissional",
        caredPersonAge: idoso ? calcularIdade(idoso.data_nascimento, date) : 0,
        date: formatarDataCurta(date),
        dateLabel: formatarDataCompleta(date),
        duration: formatarDuracao(durationInMinutes),
        durationInMinutes,
        familyMember: idoso?.nome ?? "Familiar",
        id: solicitacao.id,
        month: capitalizar(new Intl.DateTimeFormat("pt-BR", {
            month: "long",
            year: "numeric",
        }).format(date)),
        price: pagamento
            ? new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(pagamento.valor)
            : "Valor não informado",
        rating: avaliacao ? avaliacao.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 }) : "Sem avaliação",
        service: solicitacao.servico ?? "Atendimento domiciliar",
        status: mapearStatus(solicitacao.status, atendimento?.status),
        time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date),
        timestamp: date.getTime(),
    };
}

function mapearStatus(
    solicitacaoStatus: SolicitacaoApi["status"],
    atendimentoStatus?: AtendimentoApi["status"],
): AppointmentStatus {
    if (solicitacaoStatus === "CANCELADA" || atendimentoStatus === "CANCELADO") {
        return "cancelled";
    }

    if (atendimentoStatus === "CONCLUIDO") {
        return "completed";
    }

    if (atendimentoStatus === "EM_ANDAMENTO") {
        return "in_progress";
    }

    if (solicitacaoStatus === "ACEITA" || atendimentoStatus === "AGENDADO") {
        return "accepted";
    }

    return "pending";
}

function calcularDuracaoEmMinutos(inicio: string | null, fim: string | null) {
    if (!inicio || !fim) {
        return 0;
    }

    return Math.max(0, Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60_000));
}

function formatarDuracao(minutes: number) {
    if (minutes <= 0) {
        return "Não iniciado";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!remainingMinutes) {
        return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    }

    return `${hours}h ${remainingMinutes}min`;
}

function formatarDataCurta(date: Date) {
    const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(date)
        .replace(".", "")
        .toUpperCase();

    return `${day} ${month}`;
}

function formatarDataCompleta(date: Date) {
    const day = new Intl.DateTimeFormat("pt-BR", { day: "numeric" }).format(date);
    const month = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);

    return `${day} de ${month} · ${time}`;
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

function capitalizar(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
