import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    getAppointmentHistoryById,
    type AppointmentHistoryItem,
} from "@/features/app_cliente/historico_atendimentos/service/historico_atendimentos_service";

const COLORS = {
    background: "#FAF7F0",
    amber: "#A87413",
    amberSoft: "#FFF4D9",
    border: "#E5DDD7",
    green: "#77951F",
    greenSoft: "#F1F6E6",
    muted: "#8B8286",
    plum: "#7B356E",
    red: "#AD4C4C",
    redSoft: "#FAECEC",
    surface: "#FFFFFF",
    text: "#302B2E",
    white: "#FFFFFF",
} as const;

const SHADOW = {
    elevation: 2,
    shadowColor: "#4A3A42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
} as const;

export default function DetalhesAtendimentoView() {
    const router = useRouter();
    const { familiaId = "1", id } = useLocalSearchParams<{ familiaId?: string; id: string }>();
    const [appointment, setAppointment] = useState<AppointmentHistoryItem>();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoading(true);
        setLoadError(undefined);

        void getAppointmentHistoryById(id, String(familiaId), controller.signal)
            .then(setAppointment)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                setLoadError("Não foi possível carregar este atendimento. Verifique se o JSON Server está ativo.");
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => controller.abort();
    }, [familiaId, id, reloadKey]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <View style={styles.notFound}>
                    <ActivityIndicator color={COLORS.plum} size="large" />
                    <Text style={styles.loadingText}>Carregando chamado...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loadError || !appointment) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundTitle}>
                        {loadError ? "Falha ao carregar" : "Chamado não encontrado"}
                    </Text>
                    {loadError ? <Text style={styles.notFoundDescription}>{loadError}</Text> : null}
                    <Pressable
                        onPress={() => loadError ? setReloadKey((current) => current + 1) : router.back()}
                        style={styles.notFoundButton}
                    >
                        <Text style={styles.notFoundButtonText}>
                            {loadError ? "Tentar novamente" : "Voltar ao histórico"}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const status = getStatusPresentation(appointment.status);

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
                            size={24}
                            tintColor={COLORS.text}
                        />
                    </Pressable>
                    <Text style={styles.title}>Detalhes do chamado</Text>
                </View>

                <View style={[styles.statusCard, { backgroundColor: status.backgroundColor }]}>
                    <SymbolView
                        name={status.icon}
                        size={22}
                        tintColor={status.color}
                    />
                    <View style={styles.statusCopy}>
                        <Text style={[styles.statusTitle, { color: status.color }]}>
                            {status.label}
                        </Text>
                        <Text style={[styles.statusSubtitle, { color: status.color }]}>
                            {appointment.dateLabel}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <View style={styles.professionalRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(appointment.caregiver)}</Text>
                        </View>
                        <View style={styles.professionalCopy}>
                            <Text style={styles.professionalLabel}>Profissional</Text>
                            <Text style={styles.professionalName}>{appointment.caregiver}</Text>
                            {appointment.rating !== "Sem avaliação" ? <View style={styles.ratingRow}>
                                <SymbolView
                                    name={{ ios: "star.fill", android: "star", web: "star" }}
                                    size={13}
                                    tintColor="#E7B72F"
                                />
                                <Text style={styles.ratingText}>{appointment.rating}</Text>
                            </View> : null}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <DetailRow
                        label="Pessoa cuidada"
                        value={appointment.caredPersonAge
                            ? `${appointment.familyMember} · ${appointment.caredPersonAge} anos`
                            : appointment.familyMember}
                    />
                    <DetailRow label="Data e horário" value={appointment.dateLabel} />
                    <DetailRow label="Duração" value={appointment.duration} />
                    <DetailRow label="Endereço" value={appointment.address} last />
                </View>

                <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.rescheduleButton, pressed && styles.pressed]}
                >
                    <SymbolView
                        name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                        size={20}
                        tintColor={COLORS.plum}
                    />
                    <Text style={styles.rescheduleText}>Reagendar</Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                >
                    <Text style={styles.cancelText}>Cancelar atendimento</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function getStatusPresentation(status: AppointmentHistoryItem["status"]) {
    switch (status) {
        case "completed":
            return {
                backgroundColor: COLORS.greenSoft,
                color: COLORS.green,
                icon: { ios: "checkmark" as const, android: "check" as const, web: "check" as const },
                label: "Atendimento concluído",
            };
        case "cancelled":
            return {
                backgroundColor: COLORS.redSoft,
                color: COLORS.red,
                icon: { ios: "xmark" as const, android: "close" as const, web: "close" as const },
                label: "Chamado cancelado",
            };
        case "in_progress":
            return {
                backgroundColor: COLORS.greenSoft,
                color: COLORS.green,
                icon: { ios: "heart.fill" as const, android: "favorite" as const, web: "favorite" as const },
                label: "Atendimento em andamento",
            };
        case "accepted":
            return {
                backgroundColor: "#F5EDF4",
                color: COLORS.plum,
                icon: { ios: "person.fill.checkmark" as const, android: "person" as const, web: "person" as const },
                label: "Chamado aceito",
            };
        default:
            return {
                backgroundColor: COLORS.amberSoft,
                color: COLORS.amber,
                icon: { ios: "clock" as const, android: "schedule" as const, web: "schedule" as const },
                label: "Aguardando profissional",
            };
    }
}

function DetailRow({ label, last = false, value }: { label: string; last?: boolean; value: string }) {
    return (
        <View style={[styles.detailRow, last && styles.detailRowLast]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
        </View>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },
    header: { flexDirection: "row", alignItems: "center" },
    backButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    title: { color: COLORS.text, fontSize: 20, lineHeight: 25, fontWeight: "800", marginLeft: 12 },
    statusCard: { minHeight: 69, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.greenSoft, borderRadius: 16, marginTop: 25, paddingHorizontal: 17, ...SHADOW },
    statusCardCancelled: { backgroundColor: COLORS.redSoft },
    statusCopy: { flex: 1, marginLeft: 13 },
    statusTitle: { color: COLORS.green, fontSize: 18, fontWeight: "800" },
    statusTitleCancelled: { color: COLORS.red },
    statusSubtitle: { color: COLORS.green, fontSize: 10, marginTop: 3 },
    detailsCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 15, paddingHorizontal: 17, paddingTop: 18, paddingBottom: 4, ...SHADOW },
    professionalRow: { flexDirection: "row", alignItems: "center" },
    avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#D8A17E" },
    avatarText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
    professionalCopy: { flex: 1, marginLeft: 12 },
    professionalLabel: { color: COLORS.muted, fontSize: 10 },
    professionalName: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 2 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
    ratingText: { color: COLORS.text, fontSize: 11 },
    divider: { height: 1, backgroundColor: COLORS.border, marginTop: 15 },
    detailRow: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 16 },
    detailRowLast: { borderBottomWidth: 0 },
    detailLabel: { color: COLORS.muted, fontSize: 10 },
    detailValue: { flex: 1, color: COLORS.text, fontSize: 10, fontWeight: "800", textAlign: "right" },
    rescheduleButton: { minHeight: 53, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: COLORS.plum, borderRadius: 13, marginTop: 21 },
    rescheduleText: { color: COLORS.plum, fontSize: 16, fontWeight: "800" },
    cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
    cancelText: { color: COLORS.red, fontSize: 16, fontWeight: "700" },
    notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    notFoundTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
    notFoundDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 8, maxWidth: 290, textAlign: "center" },
    loadingText: { color: COLORS.muted, fontSize: 12, marginTop: 12 },
    notFoundButton: { minHeight: 46, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.plum, borderRadius: 12, marginTop: 16, paddingHorizontal: 18 },
    notFoundButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
    pressed: { opacity: 0.65 },
});
