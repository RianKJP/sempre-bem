import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    buscarContextoAtendimento,
    type ContextoAtendimento,
    type RegistroAtendimento,
    type TipoRegistroAtendimento,
} from "@/features/app_prestador/atendimento/service/api_atendimento";

const COLORS = { background: "#FAF7F0", border: "#E7DFD8", green: "#94AA2F", greenSoft: "#F1F5E4", muted: "#7D7478", plum: "#743268", plumSoft: "#F5EDF4", surface: "#FFFFFF", text: "#2E292C" } as const;

function elapsed(startTime: string | null, now: number) {
    if (!startTime) return "00:00:00";
    const seconds = Math.max(0, Math.floor((now - Date.parse(startTime)) / 1000));
    return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
        .map((value) => String(value).padStart(2, "0")).join(":");
}

const RECORD_META: Record<TipoRegistroAtendimento, { label: string; icon: SymbolViewProps["name"]; color: string }> = {
    ALIMENTACAO: { label: "Alimentação", icon: { ios: "fork.knife", android: "restaurant", web: "restaurant" }, color: "#A06A19" },
    MEDICAMENTO: { label: "Medicamento", icon: { ios: "pills.fill", android: "medication", web: "medication" }, color: "#743268" },
    MENSAGEM_CHAT: { label: "Chat", icon: { ios: "message.fill", android: "chat", web: "chat" }, color: "#47758E" },
    OBSERVACAO: { label: "Diário", icon: { ios: "book.fill", android: "menu_book", web: "menu_book" }, color: "#5F7A2C" },
    OUTRO: { label: "Outro", icon: { ios: "doc.text.fill", android: "description", web: "description" }, color: "#7D7478" },
};

export default function AtendimentosPrestadorView() {
    const router = useRouter();
    const { prestadorId = "1" } = useLocalSearchParams<{ prestadorId?: string }>();
    const [context, setContext] = useState<ContextoAtendimento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [now, setNow] = useState(Date.now());

    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            setError(undefined);
            setContext(await buscarContextoAtendimento(String(prestadorId), signal));
        } catch (loadError) {
            if (loadError instanceof Error && loadError.name === "AbortError") return;
            setError("Não foi possível carregar o atendimento atual.");
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [prestadorId]);

    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        void load(controller.signal);
        return () => controller.abort();
    }, [load]));

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    function open(pathname: "/registro-diario" | "/registro-alimentacao" | "/registro-medicamento") {
        if (!context) return;
        router.push({
            pathname,
            params: {
                atendimentoId: context.atendimentoId,
                idosoNome: context.chamado.familyMember,
                prestadorId: String(prestadorId),
            },
        });
    }


    if (loading) return <State icon="heart" text="Carregando atendimento..." loading />;
    if (error) return <State icon="exclamationmark.triangle" text={error} onRetry={() => void load()} />;
    if (!context) return <State icon="heart.slash" text="Nenhum atendimento em andamento. Quando você iniciar um chamado, a central aparecerá aqui." />;

    const { chamado, registros } = context;
    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}><View><Text style={styles.eyebrow}>ATENDIMENTO EM ANDAMENTO</Text><Text style={styles.title}>Central do atendimento</Text></View><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>AO VIVO</Text></View></View>

                <View style={styles.patientCard}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{chamado.familyMember.charAt(0).toUpperCase()}</Text></View>
                    <View style={styles.patientCopy}><Text style={styles.patientName}>{chamado.familyMember}</Text><Text style={styles.patientMeta}>{chamado.caredPersonAge ? `${chamado.caredPersonAge} anos` : "Idade não informada"}{chamado.sex ? ` · ${chamado.sex}` : ""}</Text><Text numberOfLines={1} style={styles.patientService}>{chamado.service}</Text></View>
                </View>

                <View style={styles.timerCard}><Text style={styles.timerLabel}>TEMPO DECORRIDO</Text><Text style={styles.timer}>{elapsed(chamado.startTime, now)}</Text><Text style={styles.endTime}>Término previsto: {chamado.endTime ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(chamado.endTime)) : "não informado"}</Text></View>

                <Text style={styles.sectionTitle}>Informações importantes</Text>
                <View style={styles.infoGrid}>
                    <Info label="Alergias" value={chamado.allergies} />
                    <Info label="Condições" value={chamado.healthConditions} />
                    <Info label="Mobilidade" value={chamado.mobility} />
                    <Info label="Restrições" value={chamado.restrictions} />
                </View>

                <Text style={styles.sectionTitle}>Realizar registro</Text>
                <View style={styles.actions}>
                    <Action icon={{ ios: "book.fill", android: "menu_book", web: "menu_book" }} label="Diário de bordo" subtitle="Observações e atividades" onPress={() => open("/registro-diario")} />
                    <Action icon={{ ios: "fork.knife", android: "restaurant", web: "restaurant" }} label="Alimentação" subtitle="Refeições e aceitação" onPress={() => open("/registro-alimentacao")} />
                    <Action icon={{ ios: "pills.fill", android: "medication", web: "medication" }} label="Medicamentos" subtitle="Dosagem e administração" onPress={() => open("/registro-medicamento")} />
                    <Action icon={{ ios: "message.fill", android: "chat", web: "chat" }} label="Chat com o cliente" subtitle="Mensagens sobre o atendimento" onPress={() => router.push({ pathname: "/chat", params: { atendimentoId: context.atendimentoId, usuarioId: String(prestadorId), usuarioTipo: "PRESTADOR" } } as never)} />
                </View>

                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Atividade recente</Text><Text style={styles.count}>{registros.length} registros</Text></View>
                {registros.length ? registros.slice(0, 6).map((registro) => <TimelineItem key={registro.id_registro} registro={registro} />) : <Text style={styles.empty}>Nenhum registro realizado neste atendimento.</Text>}

            </ScrollView>
        </SafeAreaView>
    );
}

function State({ icon, loading, onRetry, text }: { icon: "exclamationmark.triangle" | "heart" | "heart.slash"; loading?: boolean; onRetry?: () => void; text: string }) {
    return <SafeAreaView style={styles.screen}><View style={styles.state}>{loading ? <ActivityIndicator color={COLORS.plum} /> : <SymbolView name={{ ios: icon, android: "info", web: "info" }} size={32} tintColor={COLORS.plum} />}<Text style={styles.stateText}>{text}</Text>{onRetry ? <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable> : null}</View></SafeAreaView>;
}
function Info({ label, value }: { label: string; value: string | null }) { return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text numberOfLines={3} style={styles.infoValue}>{value || "Não informado"}</Text></View>; }
function Action({ icon, label, onPress, subtitle }: { icon: SymbolViewProps["name"]; label: string; onPress: () => void; subtitle: string }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><View style={styles.actionIcon}><SymbolView name={icon} size={23} tintColor={COLORS.plum} /></View><View style={styles.actionCopy}><Text style={styles.actionLabel}>{label}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></View><SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={19} tintColor={COLORS.muted} /></Pressable>; }
function TimelineItem({ registro }: { registro: RegistroAtendimento }) {
    const category = typeof registro.dados?.categoria === "string"
        ? registro.dados.categoria.trim()
        : "";
    const meta = category ? RECORD_META.OBSERVACAO : RECORD_META[registro.tipo];
    const label = category || meta.label;
    return <View style={styles.timeline}><View style={[styles.timelineIcon, { backgroundColor: `${meta.color}18` }]}><SymbolView name={meta.icon} size={17} tintColor={meta.color} /></View><View style={styles.timelineCopy}><View style={styles.timelineHeader}><Text style={styles.timelineType}>{label}</Text><Text style={styles.timelineDate}>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(registro.criado_em))}</Text></View><Text numberOfLines={2} style={styles.timelineDescription}>{registro.descricao}</Text></View></View>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background }, content: { width: "100%", maxWidth: 680, alignSelf: "center", padding: 16, paddingBottom: 36 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 }, eyebrow: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, title: { color: COLORS.text, fontSize: 23, fontWeight: "900", marginTop: 3 },
    livePill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, backgroundColor: COLORS.greenSoft, paddingHorizontal: 9, paddingVertical: 6 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green }, liveText: { color: COLORS.green, fontSize: 8, fontWeight: "900" },
    patientCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginTop: 18, padding: 14 }, avatar: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: COLORS.plum }, avatarText: { color: COLORS.surface, fontSize: 18, fontWeight: "900" }, patientCopy: { flex: 1, marginLeft: 12 }, patientName: { color: COLORS.text, fontSize: 17, fontWeight: "900" }, patientMeta: { color: COLORS.plum, fontSize: 11, marginTop: 2 }, patientService: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
    timerCard: { alignItems: "center", borderRadius: 18, backgroundColor: COLORS.plumSoft, marginTop: 12, paddingVertical: 17 }, timerLabel: { color: COLORS.plum, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, timer: { color: COLORS.plum, fontSize: 32, fontWeight: "900", letterSpacing: 2, marginTop: 4 }, endTime: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 22, marginBottom: 10 }, infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, info: { width: "48%", flexGrow: 1, minHeight: 70, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 11 }, infoLabel: { color: COLORS.plum, fontSize: 8, fontWeight: "900", textTransform: "uppercase" }, infoValue: { color: COLORS.text, fontSize: 10, lineHeight: 14, marginTop: 5 },
    actions: { gap: 8 }, action: { minHeight: 68, flexDirection: "row", alignItems: "center", borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingHorizontal: 12 }, actionIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.plumSoft }, actionCopy: { flex: 1, marginLeft: 11 }, actionLabel: { color: COLORS.text, fontSize: 13, fontWeight: "900" }, actionSubtitle: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, count: { color: COLORS.muted, fontSize: 9, marginTop: 15 }, timeline: { flexDirection: "row", gap: 10, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, padding: 11 }, timelineIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 11 }, timelineCopy: { flex: 1 }, timelineHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, timelineType: { color: COLORS.text, fontSize: 10, fontWeight: "900" }, timelineDate: { color: COLORS.muted, fontSize: 8 }, timelineDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 4 }, empty: { color: COLORS.muted, fontSize: 11, textAlign: "center", paddingVertical: 20 },
    state: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }, stateText: { maxWidth: 330, color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 12 }, retry: { borderRadius: 10, backgroundColor: COLORS.plum, marginTop: 14, paddingHorizontal: 16, paddingVertical: 10 }, retryText: { color: COLORS.surface, fontSize: 11, fontWeight: "800" }, pressed: { opacity: 0.68 },
});
