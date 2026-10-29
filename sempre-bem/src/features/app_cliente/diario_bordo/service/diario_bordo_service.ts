import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type ClientDiaryEntry = {
    appointmentId: string;
    caregiver: string;
    date: string;
    details: string[];
    id: string;
    kind: "DIARIO" | "ALIMENTACAO" | "MEDICAMENTO" | "OUTRO";
    person: string;
    service: string;
    tag: string;
    text: string;
    timestamp: number;
};

export type ClientActiveAttendance = {
    appointmentId: string;
    caregiver: string;
    durationHours: number;
    expectedEndAt: string | null;
    person: string;
    recordsCount: number;
    services: string[];
    startedAt: string;
};

export type ClientDiaryOverview = {
    activeAttendance: ClientActiveAttendance | null;
    entries: ClientDiaryEntry[];
};

type RegistroAtendimentoApi = {
    criado_em: string;
    dados?: Record<string, unknown>;
    descricao: string;
    id_registro: string;
    tipo: "ALIMENTACAO" | "MEDICAMENTO" | "MENSAGEM_CHAT" | "OBSERVACAO" | "OUTRO";
};

type AtendimentoApi = {
    criado_em?: string;
    data_hora_inicio?: string | null;
    data_hora_prevista_fim?: string | null;
    duracao_horas?: number;
    id: string;
    id_atendimento: string;
    id_cuidador: string;
    id_familia: string;
    id_idoso: string;
    registros_diario?: RegistroAtendimentoApi[];
    servicos?: string[];
    status?: string;
};

type IdosoApi = { id_idoso: string; nome: string };
type CuidadorApi = { id_cuidador: string; nome: string };

function textData(dados: Record<string, unknown> | undefined, key: string) {
    const value = dados?.[key];
    return typeof value === "string" ? value.trim() : "";
}

function recordTimestamp(registro: RegistroAtendimentoApi) {
    const data = textData(registro.dados, "data");
    const horario = textData(registro.dados, "horario");
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
    if (match && /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) {
        const [hour, minute] = horario.split(":").map(Number);
        const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), hour, minute);
        if (Number.isFinite(parsed.getTime())) return parsed;
    }
    return new Date(registro.criado_em);
}

function recordPresentation(registro: RegistroAtendimentoApi) {
    const dados = registro.dados;
    if (registro.tipo === "ALIMENTACAO") {
        return {
            details: [
                textData(dados, "refeicao") && `Refeição: ${textData(dados, "refeicao")}`,
                textData(dados, "alimentos") && `Alimentos: ${textData(dados, "alimentos")}`,
                textData(dados, "aceitacao") && `Aceitação: ${textData(dados, "aceitacao")}`,
            ].filter(Boolean) as string[],
            kind: "ALIMENTACAO" as const,
            tag: "Alimentação",
        };
    }
    if (registro.tipo === "MEDICAMENTO") {
        const administered = dados?.administrado;
        return {
            details: [
                textData(dados, "medicamento") && `Medicamento: ${textData(dados, "medicamento")}`,
                textData(dados, "dosagem") && `Dosagem: ${textData(dados, "dosagem")}`,
                typeof administered === "boolean" ? (administered ? "Administrado" : "Pendente") : "",
            ].filter(Boolean) as string[],
            kind: "MEDICAMENTO" as const,
            tag: "Medicamento",
        };
    }
    if (registro.tipo === "OBSERVACAO" || registro.tipo === "OUTRO") {
        return {
            details: [textData(dados, "atividades") && `Atividades: ${textData(dados, "atividades")}`].filter(Boolean) as string[],
            kind: "DIARIO" as const,
            tag: textData(dados, "categoria") || "Diário de bordo",
        };
    }
    return { details: [], kind: "OUTRO" as const, tag: "Registro" };
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Erro ${response.status} ao acessar ${url}`);
    return response.json() as Promise<T>;
}

export async function getClientDiaryOverview(
    familyId: string,
    appointmentId?: string,
    signal?: AbortSignal,
): Promise<ClientDiaryOverview> {
    const [appointments, people, caregivers] = await Promise.all([
        getJson<AtendimentoApi[]>(CLIENT_API_ENDPOINTS.atendimentos, signal),
        getJson<IdosoApi[]>(CLIENT_API_ENDPOINTS.idosos, signal),
        getJson<CuidadorApi[]>(CLIENT_API_ENDPOINTS.cuidadores, signal),
    ]);

    const familyAppointments = appointments.filter(
        (appointment) => String(appointment.id_familia) === String(familyId),
    );
    const entries = familyAppointments.flatMap((appointment) => {

        const person = people.find(
            (item) => String(item.id_idoso) === String(appointment.id_idoso),
        );
        const caregiver = caregivers.find(
            (item) => String(item.id_cuidador) === String(appointment.id_cuidador),
        );

        return (appointment.registros_diario ?? []).map((registro) => {
            const date = recordTimestamp(registro);
            const presentation = recordPresentation(registro);
            return {
                appointmentId: appointment.id_atendimento || appointment.id,
                caregiver: caregiver?.nome ?? "Profissional não informado",
                date: new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                }).format(date),
                details: presentation.details,
                id: `${appointment.id_atendimento || appointment.id}:${registro.id_registro}`,
                kind: presentation.kind,
                person: person?.nome ?? "Pessoa cuidada",
                service: appointment.servicos?.join(", ") || "Atendimento domiciliar",
                tag: presentation.tag,
                text: registro.descricao,
                timestamp: date.getTime(),
            };
        });
    }).sort((a, b) => b.timestamp - a.timestamp);

    const activeAppointment = familyAppointments
        .filter((appointment) =>
            appointment.status === "EM_ANDAMENTO" &&
            (!appointmentId ||
                String(appointment.id_atendimento || appointment.id) === String(appointmentId)),
        )
        .sort((first, second) =>
            Date.parse(second.data_hora_inicio ?? second.criado_em ?? "") -
            Date.parse(first.data_hora_inicio ?? first.criado_em ?? ""))[0];

    if (!activeAppointment?.data_hora_inicio) {
        return { activeAttendance: null, entries };
    }

    const person = people.find(
        (item) => String(item.id_idoso) === String(activeAppointment.id_idoso),
    );
    const caregiver = caregivers.find(
        (item) => String(item.id_cuidador) === String(activeAppointment.id_cuidador),
    );

    return {
        activeAttendance: {
            appointmentId: activeAppointment.id_atendimento || activeAppointment.id,
            caregiver: caregiver?.nome ?? "Profissional não informado",
            durationHours: activeAppointment.duracao_horas ?? 0,
            expectedEndAt: activeAppointment.data_hora_prevista_fim ?? null,
            person: person?.nome ?? "Pessoa cuidada",
            recordsCount: activeAppointment.registros_diario?.length ?? 0,
            services: activeAppointment.servicos ?? [],
            startedAt: activeAppointment.data_hora_inicio,
        },
        entries,
    };
}

export async function listClientDiaryEntries(
    familyId: string,
    signal?: AbortSignal,
): Promise<ClientDiaryEntry[]> {
    return (await getClientDiaryOverview(familyId, undefined, signal)).entries;
}
