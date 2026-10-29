import { PROVIDER_API_ENDPOINTS } from "@/features/app_prestador/config/api_config";
import {
    buscarDadosHomePrestador,
    type ChamadoAtualPrestador,
} from "@/features/app_prestador/home/service/api_prestador";

export type TipoRegistroAtendimento = "ALIMENTACAO" | "MEDICAMENTO" | "MENSAGEM_CHAT" | "OBSERVACAO" | "OUTRO";

export type RegistroAtendimento = {
    autor_id: string;
    autor_tipo: "CLIENTE" | "PRESTADOR" | "SISTEMA";
    criado_em: string;
    dados?: Record<string, unknown>;
    descricao: string;
    id_registro: string;
    tipo: TipoRegistroAtendimento;
};

type AtendimentoApi = {
    data_hora_inicio?: string | null;
    data_hora_prevista_fim?: string | null;
    duracao_horas?: number;
    id?: string;
    id_atendimento: string;
    id_cuidador?: string;
    registros_diario?: RegistroAtendimento[];
    status: "A_CAMINHO" | "CANCELADO_CLIENTE" | "CANCELADO_PRESTADOR" | "CONCLUIDO" | "EM_ANDAMENTO";
};

export type JanelaAtendimento = {
    fim: Date;
    inicio: Date;
};

export type ContextoAtendimento = {
    atendimentoId: string;
    chamado: ChamadoAtualPrestador;
    registros: RegistroAtendimento[];
};

export type SalvarRegistroInput = {
    dados?: Record<string, unknown>;
    descricao: string;
    registroId?: string;
    tipo: TipoRegistroAtendimento;
};

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) throw new Error(`Erro ${response.status} ao acessar ${response.url}`);
    return response.json() as Promise<T>;
}

async function buscarAtendimento(atendimentoId: string, signal?: AbortSignal) {
    const response = await fetch(PROVIDER_API_ENDPOINTS.atendimento(atendimentoId), { signal });
    return parseResponse<AtendimentoApi>(response);
}

export async function buscarJanelaAtendimento(
    atendimentoId: string,
    signal?: AbortSignal,
): Promise<JanelaAtendimento | null> {
    const atendimento = await buscarAtendimento(atendimentoId, signal);
    if (!atendimento.data_hora_inicio) return null;
    const inicio = new Date(atendimento.data_hora_inicio);
    const fimInformado = atendimento.data_hora_prevista_fim
        ? new Date(atendimento.data_hora_prevista_fim)
        : null;
    const fim = fimInformado && Number.isFinite(fimInformado.getTime())
        ? fimInformado
        : new Date(inicio.getTime() + (atendimento.duracao_horas ?? 0) * 60 * 60 * 1000);
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || fim <= inicio) return null;
    return { fim, inicio };
}

export function horarioPertenceAoAtendimento(
    horario: string,
    janela: JanelaAtendimento,
) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)) return false;
    const [hora, minuto] = horario.split(":").map(Number);
    const candidato = new Date(janela.inicio);
    candidato.setHours(hora, minuto, 0, 0);
    if (candidato < janela.inicio) candidato.setDate(candidato.getDate() + 1);
    return candidato >= janela.inicio && candidato <= janela.fim;
}

export function formatarHorarioAtendimento(data: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(data);
}

export async function buscarContextoAtendimento(
    prestadorId: string,
    signal?: AbortSignal,
): Promise<ContextoAtendimento | null> {
    const { chamadoAtual } = await buscarDadosHomePrestador(prestadorId, signal);
    if (!chamadoAtual?.appointmentId || chamadoAtual.status !== "EM_ATENDIMENTO") return null;
    const atendimento = await buscarAtendimento(chamadoAtual.appointmentId, signal);
    return {
        atendimentoId: chamadoAtual.appointmentId,
        chamado: chamadoAtual,
        registros: [...(atendimento.registros_diario ?? [])].sort(
            (first, second) => Date.parse(second.criado_em) - Date.parse(first.criado_em),
        ),
    };
}

export async function listarRegistrosAtendimento(
    atendimentoId: string,
    tipo?: TipoRegistroAtendimento,
    signal?: AbortSignal,
) {
    const atendimento = await buscarAtendimento(atendimentoId, signal);
    const registros = atendimento.registros_diario ?? [];
    return registros
        .filter((registro) => !tipo || registro.tipo === tipo)
        .sort((first, second) => Date.parse(second.criado_em) - Date.parse(first.criado_em));
}

export async function salvarRegistroAtendimento(
    atendimentoId: string,
    prestadorId: string,
    input: SalvarRegistroInput,
) {
    const atendimento = await buscarAtendimento(atendimentoId);
    const registros = atendimento.registros_diario ?? [];
    const existente = input.registroId
        ? registros.find((registro) => registro.id_registro === input.registroId)
        : undefined;
    const proximoId = String(registros.reduce((maior, registro) => {
        const id = Number(registro.id_registro);
        return Number.isFinite(id) ? Math.max(maior, id) : maior;
    }, 0) + 1);
    const registro: RegistroAtendimento = {
        autor_id: prestadorId,
        autor_tipo: "PRESTADOR",
        criado_em: existente?.criado_em ?? new Date().toISOString(),
        dados: { ...input.dados, atualizado_em: new Date().toISOString() },
        descricao: input.descricao.trim(),
        id_registro: existente?.id_registro ?? proximoId,
        tipo: input.tipo,
    };
    const novosRegistros = existente
        ? registros.map((item) => item.id_registro === existente.id_registro ? registro : item)
        : [...registros, registro];
    const response = await fetch(PROVIDER_API_ENDPOINTS.atendimento(atendimentoId), {
        body: JSON.stringify({ registros_diario: novosRegistros }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await parseResponse<AtendimentoApi>(response);
    return registro;
}

export async function excluirRegistroAtendimento(atendimentoId: string, registroId: string) {
    const atendimento = await buscarAtendimento(atendimentoId);
    const response = await fetch(PROVIDER_API_ENDPOINTS.atendimento(atendimentoId), {
        body: JSON.stringify({
            registros_diario: (atendimento.registros_diario ?? []).filter(
                (registro) => registro.id_registro !== registroId,
            ),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
    });
    await parseResponse<AtendimentoApi>(response);
}

