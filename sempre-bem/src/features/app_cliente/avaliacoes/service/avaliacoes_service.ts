import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";

type SolicitacaoApi = {
    data_hora_solicitada: string;
    id_cuidador: string | null;
    id_familia: string;
    id_idoso: string;
    id_solicitacao: string;
    servico?: string;
};

type AtendimentoApi = {
    data_hora_fim: string | null;
    data_hora_inicio: string | null;
    id: string;
    id_atendimento: string;
    id_solicitacao: string;
    status: string;
};

type CuidadorApi = { id_cuidador: string; nome: string };
type IdosoApi = { id_idoso: string; nome: string };

type AvaliacaoApi = {
    comentario?: string | null;
    criado_em?: string;
    id: string;
    id_atendimento: string;
    id_avaliacao?: string;
    nota: number;
};

export type EvaluationAppointment = {
    appointmentId: string;
    caredPerson: string;
    caregiver: string;
    comment: string;
    date: string;
    evaluationId?: string;
    rating?: number;
    service: string;
    timestamp: number;
};

export type EvaluationInput = {
    appointmentId: string;
    comment: string;
    evaluationId?: string;
    rating: number;
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Falha ${response.status} ao acessar a API.`);
    return response.json() as Promise<T>;
}

export async function listEvaluationAppointments(
    familyId: string,
    signal?: AbortSignal,
): Promise<EvaluationAppointment[]> {
    const [requests, appointments, caregivers, caredPeople, evaluations] = await Promise.all([
        getJson<SolicitacaoApi[]>(CLIENT_API_ENDPOINTS.solicitacoesDaFamilia(familyId), signal),
        getJson<AtendimentoApi[]>(CLIENT_API_ENDPOINTS.atendimentos, signal),
        getJson<CuidadorApi[]>(CLIENT_API_ENDPOINTS.cuidadores, signal),
        getJson<IdosoApi[]>(CLIENT_API_ENDPOINTS.idosos, signal),
        getJson<AvaliacaoApi[]>(CLIENT_API_ENDPOINTS.avaliacoes, signal),
    ]);

    return requests.flatMap((request) => {
        const appointment = appointments.find(
            (item) => item.id_solicitacao === request.id_solicitacao && item.status === "CONCLUIDO",
        );
        if (!appointment || !request.id_cuidador) return [];

        const appointmentId = appointment.id_atendimento || appointment.id;
        const evaluation = evaluations.find((item) => item.id_atendimento === appointmentId);
        const caregiver = caregivers.find((item) => item.id_cuidador === request.id_cuidador);
        const caredPerson = caredPeople.find((item) => item.id_idoso === request.id_idoso);
        const dateValue = appointment.data_hora_fim
            ?? appointment.data_hora_inicio
            ?? request.data_hora_solicitada;
        const timestamp = new Date(dateValue).getTime();

        return [{
            appointmentId,
            caredPerson: caredPerson?.nome ?? "Pessoa cuidada",
            caregiver: caregiver?.nome ?? "Profissional",
            comment: evaluation?.comentario ?? "",
            date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(dateValue)),
            evaluationId: evaluation?.id,
            rating: evaluation?.nota,
            service: request.servico ?? "Atendimento domiciliar",
            timestamp,
        }];
    }).sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveEvaluation(input: EvaluationInput): Promise<void> {
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        throw new Error("Selecione uma nota de 1 a 5 estrelas.");
    }

    const endpoint = input.evaluationId
        ? CLIENT_API_ENDPOINTS.avaliacao(input.evaluationId)
        : CLIENT_API_ENDPOINTS.avaliacoes;
    const response = await fetch(endpoint, {
        body: JSON.stringify({
            comentario: input.comment.trim() || null,
            ...(!input.evaluationId ? { criado_em: new Date().toISOString() } : {}),
            id_atendimento: input.appointmentId,
            nota: input.rating,
        }),
        headers: { "Content-Type": "application/json" },
        method: input.evaluationId ? "PATCH" : "POST",
    });

    if (!response.ok) {
        throw new Error("Não foi possível salvar a avaliação.");
    }
}
