import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

export type ClientDiaryEntry = {
    appointmentId: string;
    caregiver: string;
    date: string;
    id: string;
    person: string;
    service: string;
    text: string;
    timestamp: number;
};

type DiarioApi = {
    data_hora_registro: string;
    id: string;
    id_atendimento: string;
    id_diario?: string;
    observacoes: string;
};
type AtendimentoApi = { id: string; id_atendimento: string; id_solicitacao: string };
type SolicitacaoApi = { id_cuidador: string | null; id_familia: string; id_idoso: string; id_solicitacao: string; servico?: string };
type IdosoApi = { id_idoso: string; nome: string };
type CuidadorApi = { id_cuidador: string; nome: string };

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Erro ${response.status} ao acessar ${url}`);
    return response.json() as Promise<T>;
}

export async function listClientDiaryEntries(
    familyId: string,
    signal?: AbortSignal,
): Promise<ClientDiaryEntry[]> {
    const [diaries, appointments, requests, people, caregivers] = await Promise.all([
        getJson<DiarioApi[]>(CLIENT_API_ENDPOINTS.diarios, signal),
        getJson<AtendimentoApi[]>(CLIENT_API_ENDPOINTS.atendimentos, signal),
        getJson<SolicitacaoApi[]>(CLIENT_API_ENDPOINTS.solicitacoes, signal),
        getJson<IdosoApi[]>(CLIENT_API_ENDPOINTS.idosos, signal),
        getJson<CuidadorApi[]>(CLIENT_API_ENDPOINTS.cuidadores, signal),
    ]);

    return diaries.flatMap((diary) => {
        const appointment = appointments.find((item) => item.id_atendimento === diary.id_atendimento || item.id === diary.id_atendimento);
        const request = appointment
            ? requests.find((item) => item.id_solicitacao === appointment.id_solicitacao)
            : undefined;
        if (!appointment || !request || request.id_familia !== familyId) return [];

        const date = new Date(diary.data_hora_registro);
        const person = people.find((item) => item.id_idoso === request.id_idoso);
        const caregiver = caregivers.find((item) => item.id_cuidador === request.id_cuidador);

        return [{
            appointmentId: appointment.id_atendimento || appointment.id,
            caregiver: caregiver?.nome ?? "Profissional não informado",
            date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date),
            id: diary.id_diario ?? diary.id,
            person: person?.nome ?? "Pessoa cuidada",
            service: request.servico ?? "Atendimento domiciliar",
            text: diary.observacoes,
            timestamp: date.getTime(),
        }];
    }).sort((a, b) => b.timestamp - a.timestamp);
}
