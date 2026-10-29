import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    getClientDiaryOverview,
    type ClientActiveAttendance,
    type ClientDiaryEntry,
} from "@/features/app_cliente/diario_bordo/service/diario_bordo_service";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";

export default function DiarioBordoView() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        atendimentoId?: string | string[];
        familiaId?: string | string[];
    }>();
    const familiaId = Array.isArray(params.familiaId) ? params.familiaId[0] : params.familiaId ?? "1";
    const atendimentoId = Array.isArray(params.atendimentoId)
        ? params.atendimentoId[0]
        : params.atendimentoId;
    const fontsLoaded = useClienteFonts();
    const [entries, setEntries] = useState<ClientDiaryEntry[]>([]);
    const [activeAttendance, setActiveAttendance] = useState<ClientActiveAttendance | null>(null);
    const [person, setPerson] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);
    const [clockNow, setClockNow] = useState(Date.now());

    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        const loadOverview = (showLoading: boolean) => {
            if (showLoading) setLoading(true);
            setError(undefined);
            return getClientDiaryOverview(familiaId, atendimentoId, controller.signal)
            .then((overview) => {
                setActiveAttendance(overview.activeAttendance);
                setEntries(overview.entries);
            })
            .catch((failure: unknown) => {
                if (failure instanceof Error && failure.name === "AbortError") return;
                setError("Não foi possível carregar o diário de bordo.");
            })
            .finally(() => {
                if (showLoading && !controller.signal.aborted) setLoading(false);
            });
        };

        void loadOverview(true);
        const interval = setInterval(() => void loadOverview(false), 3000);
        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, [atendimentoId, familiaId, reloadKey]));

    useEffect(() => {
        if (!activeAttendance) return;
        setClockNow(Date.now());
        const interval = setInterval(() => setClockNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [activeAttendance?.appointmentId]);

    const scopedEntries = useMemo(() => {
        if (!activeAttendance) return [];

        return entries.filter(
            (entry) => String(entry.appointmentId) === String(activeAttendance.appointmentId),
        );
    }, [activeAttendance, entries]);
    const people = useMemo(() => ["Todos", ...new Set(scopedEntries.map((entry) => entry.person))], [scopedEntries]);
    const visibleEntries = person === "Todos"
        ? scopedEntries
        : scopedEntries.filter((entry) => entry.person === person);

    if (!fontsLoaded) return <View style={styles.screen} />;

    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.bookIcon}>
                        <SymbolView name={{ ios: "book", android: "menu_book", web: "menu_book" }} size={25} tintColor="#A6B778" />
                    </View>
                    <View style={styles.headerCopy}>
                        <Text accessibilityRole="header" style={styles.title}>Diário de bordo</Text>
                        <Text style={styles.subtitle}>Acompanhe os registros dos atendimentos</Text>
                    </View>
                    <Pressable accessibilityLabel="Abrir histórico" onPress={() => router.push({ pathname: "/historico_atendimentos", params: { familiaId } })} style={styles.historyButton}>
                        <SymbolView name={{ ios: "clock.arrow.circlepath", android: "history", web: "history" }} size={22} tintColor="#713568" />
                    </Pressable>
                </View>

                {activeAttendance ? (
                    <ActiveAttendanceCard attendance={activeAttendance} now={clockNow} />
                ) : null}

                {people.length > 2 ? (
                    <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
                        {people.map((value) => (
                            <Pressable key={value} onPress={() => setPerson(value)} style={[styles.filter, person === value && styles.filterActive]}>
                                <Text style={[styles.filterText, person === value && styles.filterTextActive]}>{value}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : null}

                {loading ? (
                    <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando registros...</Text></View>
                ) : error ? (
                    <View style={styles.state}>
                        <SymbolView name={{ ios: "wifi.exclamationmark", android: "cloud_off", web: "cloud_off" }} size={30} tintColor="#A84F54" />
                        <Text style={styles.stateText}>{error}</Text>
                        <Pressable onPress={() => setReloadKey((value) => value + 1)}><Text style={styles.retry}>Tentar novamente</Text></Pressable>
                    </View>
                ) : visibleEntries.length ? (
                    <View style={styles.timelineList}>
                        {visibleEntries.map((entry, index) => <DiaryTimelineItem entry={entry} isLast={index === visibleEntries.length - 1} key={entry.id} />)}
                    </View>
                ) : (
                    <View style={styles.state}>
                        <SymbolView name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }} size={34} tintColor="#91A2BC" />
                        <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
                        <Text style={styles.stateText}>Os registros feitos durante os atendimentos aparecerão aqui.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function ActiveAttendanceCard({
    attendance,
    now,
}: {
    attendance: ClientActiveAttendance;
    now: number;
}) {
    const elapsed = formatElapsed(attendance.startedAt, now);
    const expectedEnd = attendance.expectedEndAt
        ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })
            .format(new Date(attendance.expectedEndAt))
        : "Não informado";

    return (
        <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
                <View style={styles.activeStatusDot} />
                <Text style={styles.activeEyebrow}>ATENDIMENTO EM ANDAMENTO</Text>
                <View style={styles.activeRecordsPill}>
                    <Text style={styles.activeRecordsText}>{attendance.recordsCount} registros</Text>
                </View>
            </View>
            <Text style={styles.activePerson}>{attendance.person}</Text>
            <Text style={styles.activeCaregiver}>Acompanhado por {attendance.caregiver}</Text>
            <View style={styles.activeTimerCard}>
                <Text style={styles.activeTimerLabel}>TEMPO DE ATENDIMENTO</Text>
                <Text style={styles.activeTimerValue}>{elapsed}</Text>
                <Text style={styles.activeTimerEnd}>Término previsto: {expectedEnd}</Text>
            </View>
            {attendance.services.length ? (
                <Text numberOfLines={2} style={styles.activeServices}>
                    {attendance.services.join(" · ")}
                </Text>
            ) : null}
        </View>
    );
}

function formatElapsed(startTime: string, now: number) {
    const totalSeconds = Math.max(0, Math.floor((now - Date.parse(startTime)) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

const TIMELINE_META: Record<ClientDiaryEntry["kind"], { background: string; color: string; icon: SymbolViewProps["name"] }> = {
    ALIMENTACAO: { background: "#FFF3DD", color: "#A56816", icon: { ios: "fork.knife", android: "restaurant", web: "restaurant" } },
    DIARIO: { background: "#F7EDF5", color: "#713568", icon: { ios: "book.fill", android: "menu_book", web: "menu_book" } },
    MEDICAMENTO: { background: "#EAF2F7", color: "#47758E", icon: { ios: "pills.fill", android: "medication", web: "medication" } },
    OUTRO: { background: "#F1EEEA", color: "#766F73", icon: { ios: "doc.text", android: "description", web: "description" } },
};

function DiaryTimelineItem({ entry, isLast }: { entry: ClientDiaryEntry; isLast: boolean }) {
    const meta = TIMELINE_META[entry.kind];
    return (
        <View style={styles.timelineRow}>
            <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: meta.background }]}><SymbolView name={meta.icon} size={19} tintColor={meta.color} /></View>
                {!isLast ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                    <View style={[styles.timelineTag, { backgroundColor: meta.background }]}><Text style={[styles.timelineTagText, { color: meta.color }]}>{entry.tag}</Text></View>
                    <Text style={styles.timelineDate}>{entry.date}</Text>
                </View>
                <Text style={styles.timelinePerson}>{entry.person}</Text>
                <Text style={styles.timelineText}>{entry.text}</Text>
                {entry.details.length ? <View style={styles.timelineDetails}>{entry.details.map((detail) => <Text key={detail} style={styles.timelineDetail}>• {detail}</Text>)}</View> : null}
                <View style={styles.timelineDivider} />
                <Text style={styles.timelineService}>{entry.service}</Text>
                <Text style={styles.timelineCaregiver}>Registrado por {entry.caregiver}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" },
    scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, width: "100%", maxWidth: 680, alignSelf: "center" },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    bookIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#F0F4E3", alignItems: "center", justifyContent: "center" },
    headerCopy: { flex: 1 },
    title: { fontFamily: "Poppins-SemiBold", fontSize: 21, lineHeight: 28, color: "#262326" },
    subtitle: { fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#81767B" },
    historyButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
    activeCard: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#D7E1B8", backgroundColor: "#FFFFFF", marginTop: 18, padding: 16, elevation: 2, shadowColor: "#82934F", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    activeHeader: { flexDirection: "row", alignItems: "center" },
    activeStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#94AA32", marginRight: 7 },
    activeEyebrow: { flex: 1, color: "#82934F", fontFamily: "Poppins-SemiBold", fontSize: 8, letterSpacing: 0.5 },
    activeRecordsPill: { borderRadius: 8, backgroundColor: "#F0F4E3", paddingHorizontal: 8, paddingVertical: 5 },
    activeRecordsText: { color: "#82934F", fontFamily: "Poppins-SemiBold", fontSize: 8 },
    activePerson: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 19, marginTop: 12 },
    activeCaregiver: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 10, marginTop: 2 },
    activeTimerCard: { alignItems: "center", borderRadius: 16, backgroundColor: "#F7EDF5", marginTop: 14, paddingVertical: 15 },
    activeTimerLabel: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 8, letterSpacing: 0.55 },
    activeTimerValue: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 31, letterSpacing: 1.5, marginTop: 3 },
    activeTimerEnd: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9, marginTop: 3 },
    activeServices: { color: "#3E383C", fontFamily: "Poppins-Regular", fontSize: 10, lineHeight: 15, marginTop: 12 },
    filters: { gap: 8, paddingVertical: 18 },
    filter: { minHeight: 38, paddingHorizontal: 15, borderRadius: 19, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", justifyContent: "center" },
    filterActive: { backgroundColor: "#A6B778", borderColor: "#A6B778" },
    filterText: { fontFamily: "Poppins-Medium", fontSize: 11, color: "#59667B" },
    filterTextActive: { color: "#FFFFFF" },
    timelineList: { marginTop: 20 },
    timelineRow: { flexDirection: "row", alignItems: "stretch" },
    timelineRail: { width: 42, alignItems: "center" },
    timelineDot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", zIndex: 1 },
    timelineLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: "#DDD5D2" },
    timelineCard: { flex: 1, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: "#E2DCD5", backgroundColor: "#FFFFFF", marginLeft: 7, marginBottom: 14 },
    timelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    timelineTag: { maxWidth: "58%", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
    timelineTagText: { fontFamily: "Poppins-SemiBold", fontSize: 9 },
    timelineDate: { flexShrink: 1, textAlign: "right", fontFamily: "Poppins-Regular", fontSize: 8, color: "#81767B" },
    timelinePerson: { marginTop: 10, fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#262326" },
    timelineText: { marginTop: 7, fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 18, color: "#3E383C" },
    timelineDetails: { gap: 3, borderRadius: 10, backgroundColor: "#FAF8F4", marginTop: 9, padding: 9 },
    timelineDetail: { fontFamily: "Poppins-Regular", fontSize: 9, lineHeight: 14, color: "#625B5F" },
    timelineDivider: { height: 1, marginVertical: 10, backgroundColor: "#EEE8E2" },
    timelineService: { fontFamily: "Poppins-Medium", fontSize: 9, color: "#713568" },
    timelineCaregiver: { marginTop: 3, fontFamily: "Poppins-Regular", fontSize: 8, color: "#81767B" },
    state: { minHeight: 260, marginTop: 24, padding: 24, alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, backgroundColor: "#FFFFFF" },
    stateText: { maxWidth: 300, fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#81767B", textAlign: "center" },
    emptyTitle: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#262326" },
    retry: { fontFamily: "Poppins-SemiBold", fontSize: 12, color: "#713568" },
});
