import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/core/components/primary_button";
import {
    listEvaluationAppointments,
    saveEvaluation,
    type EvaluationAppointment,
} from "@/features/app_cliente/avaliacoes/service/avaliacoes_service";
import { ClienteHeader } from "@/features/perfil_cliente/components/cliente_header";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";

const COLORS = {
    background: "#F8F5ED",
    border: "#DDD5D2",
    gold: "#DEA700",
    muted: "#81767B",
    plum: "#713568",
    plumSoft: "#F4EAF2",
    surface: "#FFFFFF",
    text: "#262326",
} as const;

export default function AvaliacoesView() {
    const router = useRouter();
    const params = useLocalSearchParams<{ familiaId?: string | string[] }>();
    const familyId = Array.isArray(params.familiaId) ? params.familiaId[0] : params.familiaId ?? "1";
    const fontsLoaded = useClienteFonts();
    const [appointments, setAppointments] = useState<EvaluationAppointment[]>([]);
    const [selected, setSelected] = useState<EvaluationAppointment>();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();
    const [formError, setFormError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(undefined);
        void listEvaluationAppointments(familyId, controller.signal)
            .then(setAppointments)
            .catch((failure: unknown) => {
                if (failure instanceof Error && failure.name === "AbortError") return;
                setError("Não foi possível carregar os atendimentos para avaliação.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [familyId, reloadKey]));

    const summary = useMemo(() => {
        const evaluated = appointments.filter((item) => item.rating);
        const average = evaluated.length
            ? evaluated.reduce((total, item) => total + (item.rating ?? 0), 0) / evaluated.length
            : 0;
        return { average, evaluated: evaluated.length };
    }, [appointments]);

    function openForm(item: EvaluationAppointment) {
        setSelected(item);
        setRating(item.rating ?? 0);
        setComment(item.comment);
        setFormError(undefined);
    }

    function closeForm() {
        if (saving) return;
        setSelected(undefined);
        setFormError(undefined);
    }

    async function submit() {
        if (!selected || saving) return;
        if (!rating) {
            setFormError("Selecione uma nota de 1 a 5 estrelas.");
            return;
        }

        setSaving(true);
        setFormError(undefined);
        try {
            await saveEvaluation({
                appointmentId: selected.appointmentId,
                comment,
                evaluationId: selected.evaluationId,
                rating,
            });
            setSelected(undefined);
            setReloadKey((value) => value + 1);
        } catch (failure) {
            setFormError(failure instanceof Error ? failure.message : "Não foi possível salvar a avaliação.");
        } finally {
            setSaving(false);
        }
    }

    if (!fontsLoaded) return <View style={styles.screen} />;

    return (
        <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <ClienteHeader
                        title="Avaliação dos cuidadores"
                        onBack={() => router.canGoBack() ? router.back() : router.replace("/cliente")}
                    />
                    <Text style={styles.subtitle}>Avalie os profissionais depois de um atendimento concluído.</Text>

                    <View style={styles.summaryCard}>
                        <Text style={styles.average}>{summary.evaluated ? summary.average.toFixed(1).replace(".", ",") : "—"}</Text>
                        <Text style={styles.summaryStars}>{renderStars(Math.round(summary.average))}</Text>
                        <Text style={styles.summaryText}>
                            {summary.evaluated} {summary.evaluated === 1 ? "avaliação registrada" : "avaliações registradas"}
                        </Text>
                    </View>

                    {loading ? (
                        <View style={styles.state}>
                            <ActivityIndicator color={COLORS.plum} />
                            <Text style={styles.stateText}>Carregando atendimentos...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.state}>
                            <Text style={styles.stateText}>{error}</Text>
                            <Pressable onPress={() => setReloadKey((value) => value + 1)}>
                                <Text style={styles.retry}>Tentar novamente</Text>
                            </Pressable>
                        </View>
                    ) : appointments.length ? (
                        <View style={styles.list}>
                            {appointments.map((item) => (
                                <EvaluationCard item={item} key={item.appointmentId} onPress={() => openForm(item)} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.state}>
                            <SymbolView name={{ ios: "star", android: "star_border", web: "star_border" }} size={34} tintColor={COLORS.muted} />
                            <Text style={styles.emptyTitle}>Nenhum atendimento para avaliar</Text>
                            <Text style={styles.stateText}>Os atendimentos concluídos aparecerão aqui.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal animationType="slide" onRequestClose={closeForm} visible={Boolean(selected)}>
                <SafeAreaView style={styles.screen}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
                        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                            <View style={styles.content}>
                                <Pressable accessibilityRole="button" disabled={saving} onPress={closeForm} style={styles.closeButton}>
                                    <Text style={styles.closeText}>‹ Voltar</Text>
                                </Pressable>
                                <Text accessibilityRole="header" style={styles.title}>
                                    {selected?.evaluationId ? "Editar avaliação" : "Avaliar cuidador"}
                                </Text>
                                <Text style={styles.subtitle}>{selected?.caregiver} · atendimento para {selected?.caredPerson}</Text>

                                <Text style={styles.label}>Nota geral</Text>
                                <View style={styles.starSelector}>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <Pressable
                                            accessibilityLabel={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: rating === value }}
                                            disabled={saving}
                                            key={value}
                                            onPress={() => setRating(value)}
                                            style={styles.starButton}
                                        >
                                            <SymbolView
                                                name={{ ios: value <= rating ? "star.fill" : "star", android: value <= rating ? "star" : "star_border", web: value <= rating ? "star" : "star_border" }}
                                                size={36}
                                                tintColor={COLORS.gold}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                                <Text style={styles.helper}>{rating ? `${rating} de 5 estrelas` : "Toque nas estrelas para avaliar"}</Text>

                                <Text style={styles.label}>Comentário (opcional)</Text>
                                <TextInput
                                    editable={!saving}
                                    maxLength={1000}
                                    multiline
                                    onChangeText={setComment}
                                    placeholder="Descreva sua experiência com o cuidador"
                                    placeholderTextColor="#AAA2A5"
                                    style={styles.commentInput}
                                    textAlignVertical="top"
                                    value={comment}
                                />
                                {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
                                <PrimaryButton cadastro disabled={saving} onPress={submit} title={saving ? "Salvando..." : "Salvar avaliação"} />
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

function EvaluationCard({ item, onPress }: { item: EvaluationAppointment; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.caregiver.charAt(0).toUpperCase()}</Text></View>
                <View style={styles.cardCopy}>
                    <Text style={styles.caregiver}>{item.caregiver}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                </View>
                <Text style={styles.cardRating}>{item.rating ? `★ ${item.rating},0` : "Não avaliado"}</Text>
            </View>
            <Text style={styles.service}>{item.service}</Text>
            <Text style={styles.cardDescription}>Atendimento para {item.caredPerson}</Text>
            {item.comment ? <Text numberOfLines={2} style={styles.comment}>{item.comment}</Text> : null}
            <Text style={styles.actionText}>{item.rating ? "Editar avaliação" : "Avaliar cuidador"}</Text>
        </Pressable>
    );
}

function renderStars(rating: number) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    scroll: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 32 },
    modalScroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    content: { width: "100%", maxWidth: 680, alignSelf: "center" },
    title: { fontFamily: "Poppins-SemiBold", fontSize: 22, lineHeight: 29, color: COLORS.text },
    subtitle: { fontFamily: "Poppins-Regular", fontSize: 13, lineHeight: 19, color: COLORS.muted, marginTop: 8 },
    summaryCard: { alignItems: "center", marginTop: 22, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    average: { fontFamily: "Poppins-Bold", fontSize: 34, color: COLORS.plum },
    summaryStars: { color: COLORS.gold, fontSize: 21, letterSpacing: 2, marginTop: 2 },
    summaryText: { fontFamily: "Poppins-Regular", fontSize: 11, color: COLORS.muted, marginTop: 6 },
    state: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18, padding: 20, borderRadius: 16, backgroundColor: COLORS.surface },
    stateText: { maxWidth: 330, fontFamily: "Poppins-Regular", fontSize: 12, lineHeight: 18, color: COLORS.muted, textAlign: "center" },
    emptyTitle: { fontFamily: "Poppins-SemiBold", fontSize: 15, color: COLORS.text },
    retry: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: COLORS.plum },
    list: { gap: 12, marginTop: 20 },
    card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
    avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: COLORS.plumSoft },
    avatarText: { fontFamily: "Poppins-SemiBold", fontSize: 17, color: COLORS.plum },
    cardCopy: { flex: 1, minWidth: 0 },
    caregiver: { fontFamily: "Poppins-SemiBold", fontSize: 15, color: COLORS.text },
    cardDate: { fontFamily: "Poppins-Regular", fontSize: 10, color: COLORS.muted, marginTop: 2 },
    cardRating: { fontFamily: "Poppins-Medium", fontSize: 11, color: COLORS.gold },
    service: { fontFamily: "Poppins-Medium", fontSize: 12, color: COLORS.text, marginTop: 13 },
    cardDescription: { fontFamily: "Poppins-Regular", fontSize: 11, color: COLORS.muted, marginTop: 3 },
    comment: { fontFamily: "Poppins-Regular", fontSize: 12, lineHeight: 18, color: COLORS.text, marginTop: 10 },
    actionText: { fontFamily: "Poppins-SemiBold", fontSize: 12, color: COLORS.plum, marginTop: 13 },
    closeButton: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", marginBottom: 8 },
    closeText: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: COLORS.plum },
    label: { fontFamily: "Poppins-Medium", fontSize: 13, color: COLORS.text, marginTop: 24, marginBottom: 10 },
    starSelector: { flexDirection: "row", justifyContent: "space-between", maxWidth: 300 },
    starButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
    helper: { fontFamily: "Poppins-Regular", fontSize: 11, color: COLORS.muted, marginTop: 2 },
    commentInput: { minHeight: 130, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, fontFamily: "Poppins-Regular", fontSize: 13, lineHeight: 20, color: COLORS.text },
    error: { fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#A12636", marginTop: 10, marginBottom: 10 },
    pressed: { opacity: 0.68 },
});
