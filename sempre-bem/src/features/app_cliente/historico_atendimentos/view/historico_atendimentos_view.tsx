import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    listAppointmentHistory,
    type AppointmentHistoryItem,
    type AppointmentStatus,
} from "@/features/app_cliente/historico_atendimentos/service/historico_atendimentos_service";

const COLORS = {
    background: "#FAF7F0",
    amber: "#A87413",
    amberSoft: "#FFF4D9",
    border: "#E7DFD8",
    green: "#8FA52C",
    greenSoft: "#F0F4E1",
    muted: "#7D7478",
    plum: "#743268",
    plumSoft: "#F5EDF4",
    red: "#B85E61",
    redSoft: "#F9EDEE",
    surface: "#FFFFFF",
    text: "#2E292C",
    white: "#FFFFFF",
} as const;

const SHADOW = {
    elevation: 2,
    shadowColor: "#4A3A42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
} as const;

type HistoryFilter = "active" | "all" | "cancelled" | "completed";

export default function HistoricoAtendimentosView() {
    const router = useRouter();
    const { familiaId = "1" } = useLocalSearchParams<{ familiaId?: string }>();
    const [filter, setFilter] = useState<HistoryFilter>("all");
    const [history, setHistory] = useState<AppointmentHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useFocusEffect(
        useCallback(() => {
            const controller = new AbortController();

            setIsLoading(true);
            setLoadError(undefined);

            void listAppointmentHistory(String(familiaId), controller.signal)
                .then(setHistory)
                .catch((error: unknown) => {
                    if (error instanceof Error && error.name === "AbortError") {
                        return;
                    }

                    setLoadError("Não foi possível carregar o histórico. Verifique se o JSON Server está ativo.");
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setIsLoading(false);
                    }
                });

            return () => controller.abort();
        }, [familiaId, reloadKey]),
    );

    const filteredHistory = useMemo(
        () => {
            if (filter === "all") {
                return history;
            }

            if (filter === "active") {
                return history.filter((item) =>
                    item.status === "accepted" ||
                    item.status === "in_progress" ||
                    item.status === "pending",
                );
            }

            return history.filter((item) => item.status === filter);
        },
        [filter, history],
    );

    const sections = useMemo(() => {
        return filteredHistory.reduce<Array<{ month: string; items: AppointmentHistoryItem[] }>>(
            (groups, item) => {
                const currentGroup = groups.at(-1);

                if (currentGroup?.month === item.month) {
                    currentGroup.items.push(item);
                } else {
                    groups.push({ month: item.month, items: [item] });
                }

                return groups;
            },
            [],
        );
    }, [filteredHistory]);

    const completedHistory = useMemo(
        () => history.filter((item) => item.status === "completed"),
        [history],
    );
    const completedMinutes = completedHistory.reduce(
        (total, item) => total + item.durationInMinutes,
        0,
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <ScrollView
                alwaysBounceVertical={false}
                bounces={false}
                contentContainerStyle={styles.content}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable
                        accessibilityLabel="Voltar"
                        hitSlop={8}
                        onPress={() => router.back()}
                        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                    >
                        <SymbolView
                            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                            size={23}
                            tintColor={COLORS.text}
                        />
                    </Pressable>
                    <View style={styles.headerCopy}>
                        <Text style={styles.title}>Histórico de chamados</Text>
                        <Text style={styles.subtitle}>Todas as solicitações de cuidado da sua família</Text>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryIcon}>
                        <SymbolView
                            name={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
                            size={24}
                            tintColor={COLORS.white}
                        />
                    </View>
                    <View style={styles.summaryCopy}>
                        <Text style={styles.summaryEyebrow}>RESUMO DOS CUIDADOS</Text>
                        <Text style={styles.summaryTitle}>
                            {completedHistory.length} {completedHistory.length === 1 ? "atendimento concluído" : "atendimentos concluídos"}
                        </Text>
                        <Text style={styles.summarySubtitle}>
                            {formatSummaryDuration(completedMinutes)} de cuidado neste período
                        </Text>
                    </View>
                </View>

                <View style={styles.filters}>
                    <FilterButton active={filter === "all"} label="Todos" onPress={() => setFilter("all")} />
                    <FilterButton
                        active={filter === "active"}
                        label="Em aberto"
                        onPress={() => setFilter("active")}
                    />
                    <FilterButton
                        active={filter === "completed"}
                        label="Concluídos"
                        onPress={() => setFilter("completed")}
                    />
                    <FilterButton
                        active={filter === "cancelled"}
                        label="Cancelados"
                        onPress={() => setFilter("cancelled")}
                    />
                </View>

                {isLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator color={COLORS.plum} size="large" />
                        <Text style={styles.stateDescription}>Carregando histórico...</Text>
                    </View>
                ) : loadError ? (
                    <View style={styles.emptyState}>
                        <SymbolView
                            name={{ ios: "wifi.exclamationmark", android: "cloud_off", web: "cloud_off" }}
                            size={30}
                            tintColor={COLORS.red}
                        />
                        <Text style={styles.emptyTitle}>Falha ao carregar</Text>
                        <Text style={styles.emptyDescription}>{loadError}</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setReloadKey((current) => current + 1)}
                            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.retryButtonText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : sections.length ? sections.map((section) => (
                    <View key={section.month} style={styles.monthSection}>
                        <Text style={styles.monthTitle}>{section.month}</Text>
                        <View style={styles.appointmentList}>
                            {section.items.map((item) => (
                                <AppointmentCard
                                    item={item}
                                    key={item.id}
                                    onPress={() => router.push({
                                        pathname: "/historico_atendimentos/[id]",
                                        params: { familiaId: String(familiaId), id: item.id },
                                    })}
                                />
                            ))}
                        </View>
                    </View>
                )) : (
                    <View style={styles.emptyState}>
                        <SymbolView
                            name={{ ios: "calendar", android: "event_busy", web: "event_busy" }}
                            size={30}
                            tintColor={COLORS.muted}
                        />
                        <Text style={styles.emptyTitle}>Nenhum chamado encontrado</Text>
                        <Text style={styles.emptyDescription}>Não há registros com o filtro selecionado.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function formatSummaryDuration(minutes: number) {
    if (!minutes) {
        return "Nenhuma hora";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours} ${hours === 1 ? "hora" : "horas"}`;
}

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.filterButton,
                active && styles.filterButtonActive,
                pressed && styles.pressed,
            ]}
        >
            <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
        </Pressable>
    );
}

function AppointmentCard({ item, onPress }: { item: AppointmentHistoryItem; onPress: () => void }) {
    const completed = item.status === "completed";
    const status = getStatusPresentation(item.status);

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [styles.appointmentCard, pressed && styles.pressed]}
        >
            <View style={styles.appointmentTopRow}>
                <View style={styles.dateBox}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={styles.appointmentCopy}>
                    <Text style={styles.familyMember}>{item.familyMember}</Text>
                    <Text numberOfLines={1} style={styles.service}>{item.service}</Text>
                </View>
                <View style={[styles.statusBadge, status.badgeStyle]}>
                    <Text style={[styles.statusText, status.textStyle]}>
                        {status.label}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.caregiverRow}>
                <View style={styles.caregiverAvatar}>
                    <SymbolView
                        name={{ ios: "person.fill", android: "person", web: "person" }}
                        size={17}
                        tintColor={COLORS.plum}
                    />
                </View>
                <View style={styles.caregiverCopy}>
                    <Text style={styles.caregiverLabel}>PROFISSIONAL</Text>
                    <Text style={styles.caregiverName}>{item.caregiver}</Text>
                </View>
                <View style={styles.priceCopy}>
                    <Text style={styles.duration}>{item.duration}</Text>
                    <Text style={styles.price}>{item.price}</Text>
                </View>
            </View>

            {completed ? (
                <View style={styles.cardFooter}>
                    <View style={styles.ratingPrompt}>
                        <SymbolView
                            name={{ ios: "star.fill", android: "star", web: "star" }}
                            size={13}
                            tintColor="#E9B92D"
                        />
                        <Text style={styles.ratingPromptText}>Atendimento avaliado</Text>
                    </View>
                    <Text style={styles.detailsLink}>Ver detalhes</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

function getStatusPresentation(status: AppointmentStatus) {
    switch (status) {
        case "completed":
            return { badgeStyle: styles.statusCompleted, label: "Concluído", textStyle: styles.statusTextCompleted };
        case "cancelled":
            return { badgeStyle: styles.statusCancelled, label: "Cancelado", textStyle: styles.statusTextCancelled };
        case "in_progress":
            return { badgeStyle: styles.statusInProgress, label: "Em andamento", textStyle: styles.statusTextInProgress };
        case "accepted":
            return { badgeStyle: styles.statusAccepted, label: "Aceito", textStyle: styles.statusTextAccepted };
        default:
            return { badgeStyle: styles.statusPending, label: "Pendente", textStyle: styles.statusTextPending };
    }
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
    header: { flexDirection: "row", alignItems: "center" },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW },
    headerCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
    title: { color: COLORS.text, fontSize: 21, lineHeight: 26, fontWeight: "800" },
    subtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
    summaryCard: { minHeight: 104, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.plum, borderRadius: 18, marginTop: 21, padding: 17, ...SHADOW },
    summaryIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 255, 255, 0.15)" },
    summaryCopy: { flex: 1, marginLeft: 13 },
    summaryEyebrow: { color: "#E8D8E5", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
    summaryTitle: { color: COLORS.white, fontSize: 16, fontWeight: "800", marginTop: 5 },
    summarySubtitle: { color: "#E8D8E5", fontSize: 10, marginTop: 4 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
    filterButton: { minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 15 },
    filterButtonActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
    filterLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
    filterLabelActive: { color: COLORS.white },
    monthSection: { marginTop: 22 },
    monthTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginBottom: 10 },
    appointmentList: { gap: 11 },
    appointmentCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 13, ...SHADOW },
    appointmentTopRow: { flexDirection: "row", alignItems: "center" },
    dateBox: { width: 54, height: 51, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: COLORS.plumSoft },
    dateText: { color: COLORS.plum, fontSize: 10, fontWeight: "900" },
    timeText: { color: COLORS.text, fontSize: 11, fontWeight: "800", marginTop: 3 },
    appointmentCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
    familyMember: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
    service: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
    statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
    statusCompleted: { backgroundColor: COLORS.greenSoft },
    statusCancelled: { backgroundColor: COLORS.redSoft },
    statusPending: { backgroundColor: COLORS.amberSoft },
    statusAccepted: { backgroundColor: COLORS.plumSoft },
    statusInProgress: { backgroundColor: COLORS.greenSoft },
    statusText: { fontSize: 8, fontWeight: "800" },
    statusTextCompleted: { color: COLORS.green },
    statusTextCancelled: { color: COLORS.red },
    statusTextPending: { color: COLORS.amber },
    statusTextAccepted: { color: COLORS.plum },
    statusTextInProgress: { color: COLORS.green },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 11 },
    caregiverRow: { flexDirection: "row", alignItems: "center" },
    caregiverAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.plumSoft },
    caregiverCopy: { flex: 1, marginLeft: 9 },
    caregiverLabel: { color: COLORS.muted, fontSize: 7, fontWeight: "700", letterSpacing: 0.35 },
    caregiverName: { color: COLORS.text, fontSize: 11, fontWeight: "700", marginTop: 2 },
    priceCopy: { alignItems: "flex-end" },
    duration: { color: COLORS.muted, fontSize: 8 },
    price: { color: COLORS.text, fontSize: 11, fontWeight: "800", marginTop: 3 },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
    ratingPrompt: { flexDirection: "row", alignItems: "center", gap: 5 },
    ratingPromptText: { color: COLORS.muted, fontSize: 9 },
    detailsLink: { color: COLORS.plum, fontSize: 10, fontWeight: "800" },
    emptyState: { alignItems: "center", justifyContent: "center", minHeight: 220, marginTop: 18, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    loadingState: { alignItems: "center", justifyContent: "center", minHeight: 220, marginTop: 18 },
    stateDescription: { color: COLORS.muted, fontSize: 11, marginTop: 10 },
    emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 12 },
    emptyDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 270, textAlign: "center" },
    retryButton: { minHeight: 40, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.plum, borderRadius: 10, marginTop: 14, paddingHorizontal: 16 },
    retryButtonText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
    pressed: { opacity: 0.65 },
});
