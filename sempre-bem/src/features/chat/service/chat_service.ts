import { API_BASE_URL } from "@/core/config/api_config";

export type ChatActorType = "CLIENTE" | "PRESTADOR";

export type ChatMessage = {
    authorId: string;
    authorType: ChatActorType;
    createdAt: string;
    edited: boolean;
    id: string;
    text: string;
    updatedAt: string;
};

export type ChatConversation = {
    attendanceId: string;
    contactName: string;
    messages: ChatMessage[];
    status: string;
};

type AttendanceRecord = {
    autor_id: string;
    autor_tipo: "CLIENTE" | "PRESTADOR" | "SISTEMA";
    criado_em: string;
    dados?: Record<string, unknown>;
    descricao: string;
    id_registro: string;
    tipo: "ALIMENTACAO" | "MEDICAMENTO" | "MENSAGEM_CHAT" | "OBSERVACAO" | "OUTRO";
};

type AttendanceApi = {
    id?: string;
    id_atendimento: string;
    id_cuidador: string;
    id_familia: string;
    registros_diario?: AttendanceRecord[];
    status: string;
};

type NamedAccount = { nome?: string };

const attendanceUrl = (id: string) => `${API_BASE_URL}/atendimento/${encodeURIComponent(id)}`;

async function json<T>(response: Response): Promise<T> {
    if (!response.ok) throw new Error(`Não foi possível acessar a conversa (erro ${response.status}).`);
    return response.json() as Promise<T>;
}

async function loadAttendance(attendanceId: string, signal?: AbortSignal) {
    const directResponse = await fetch(attendanceUrl(attendanceId), { signal });
    if (directResponse.ok) {
        const attendance = await directResponse.json() as AttendanceApi;
        return {
            attendance,
            resourceId: String(attendance.id ?? attendanceId),
        };
    }
    if (directResponse.status !== 404) return json<never>(directResponse);

    // JSON Server 1 beta não filtra de forma confiável campos de ID customizados.
    // Carregamos a coleção e resolvemos o id_atendimento no cliente.
    const matches = await json<AttendanceApi[]>(await fetch(`${API_BASE_URL}/atendimento`, { signal }));
    const attendance = matches.find((item) =>
        String(item.id) === String(attendanceId) ||
        String(item.id_atendimento) === String(attendanceId));
    if (!attendance) throw new Error("O atendimento desta conversa não foi encontrado.");
    return {
        attendance,
        resourceId: String(attendance.id ?? attendance.id_atendimento),
    };
}

function mapMessage(record: AttendanceRecord): ChatMessage {
    const updatedAt = typeof record.dados?.atualizado_em === "string"
        ? record.dados.atualizado_em
        : record.criado_em;
    return {
        authorId: String(record.autor_id),
        authorType: record.autor_tipo === "PRESTADOR" ? "PRESTADOR" : "CLIENTE",
        createdAt: record.criado_em,
        edited: Boolean(record.dados?.editado),
        id: String(record.id_registro),
        text: record.descricao,
        updatedAt,
    };
}

async function contactName(attendance: AttendanceApi, actorType: ChatActorType, signal?: AbortSignal) {
    const collection = actorType === "CLIENTE" ? "cuidador" : "familia";
    const id = actorType === "CLIENTE" ? attendance.id_cuidador : attendance.id_familia;
    const response = await fetch(`${API_BASE_URL}/${collection}/${encodeURIComponent(id)}`, { signal });
    if (!response.ok) return actorType === "CLIENTE" ? "Profissional" : "Cliente";
    const account = await response.json() as NamedAccount;
    return account.nome?.trim() || (actorType === "CLIENTE" ? "Profissional" : "Cliente");
}

export async function loadChatConversation(
    attendanceId: string,
    actorType: ChatActorType,
    signal?: AbortSignal,
): Promise<ChatConversation> {
    const { attendance } = await loadAttendance(attendanceId, signal);
    const messages = (attendance.registros_diario ?? [])
        .filter((record) => record.tipo === "MENSAGEM_CHAT")
        .map(mapMessage)
        .sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
    return {
        attendanceId: attendance.id_atendimento,
        contactName: await contactName(attendance, actorType, signal),
        messages,
        status: attendance.status,
    };
}

async function updateRecords(
    attendanceId: string,
    change: (records: AttendanceRecord[]) => AttendanceRecord[],
) {
    const { attendance, resourceId } = await loadAttendance(attendanceId);
    if (["CANCELADO_CLIENTE", "CANCELADO_PRESTADOR", "CONCLUIDO"].includes(attendance.status)) {
        throw new Error("Este atendimento foi encerrado e não aceita novas mensagens.");
    }
    const response = await fetch(attendanceUrl(resourceId), {
        body: JSON.stringify({ registros_diario: change(attendance.registros_diario ?? []) }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await json<AttendanceApi>(response);
}

export async function sendChatMessage(
    attendanceId: string,
    actorId: string,
    actorType: ChatActorType,
    text: string,
) {
    const now = new Date().toISOString();
    const record: AttendanceRecord = {
        autor_id: actorId,
        autor_tipo: actorType,
        criado_em: now,
        dados: { atualizado_em: now, editado: false },
        descricao: text.trim(),
        id_registro: `chat-${actorType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo: "MENSAGEM_CHAT",
    };
    await updateRecords(attendanceId, (records) => [...records, record]);
    return mapMessage(record);
}

export async function editChatMessage(
    attendanceId: string,
    messageId: string,
    actorId: string,
    actorType: ChatActorType,
    text: string,
) {
    let found = false;
    await updateRecords(attendanceId, (records) => records.map((record) => {
        if (String(record.id_registro) !== messageId || record.tipo !== "MENSAGEM_CHAT") return record;
        if (String(record.autor_id) !== String(actorId) || record.autor_tipo !== actorType) {
            throw new Error("Você só pode editar suas próprias mensagens.");
        }
        found = true;
        return {
            ...record,
            dados: { ...record.dados, atualizado_em: new Date().toISOString(), editado: true },
            descricao: text.trim(),
        };
    }));
    if (!found) throw new Error("Mensagem não encontrada.");
}

export async function deleteChatMessage(
    attendanceId: string,
    messageId: string,
    actorId: string,
    actorType: ChatActorType,
) {
    let found = false;
    await updateRecords(attendanceId, (records) => records.filter((record) => {
        if (String(record.id_registro) !== messageId || record.tipo !== "MENSAGEM_CHAT") return true;
        if (String(record.autor_id) !== String(actorId) || record.autor_tipo !== actorType) {
            throw new Error("Você só pode excluir suas próprias mensagens.");
        }
        found = true;
        return false;
    }));
    if (!found) throw new Error("Mensagem não encontrada.");
}
