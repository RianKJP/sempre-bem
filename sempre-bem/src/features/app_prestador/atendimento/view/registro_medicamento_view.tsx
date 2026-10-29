import { excluirRegistroAtendimento, listarRegistrosAtendimento, salvarRegistroAtendimento, type RegistroAtendimento } from "@/features/app_prestador/atendimento/service/api_atendimento";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = { background: "#F7F4EC", card: "#FFFEF8", primary: "#77325F", primarySoft: "#F1E8F0", border: "#E6E0D4", text: "#1E1A1D", muted: "#8A8580", okBg: "#EAF3DE", okText: "#3B6D11", pendingBg: "#FAEEDA", pendingText: "#854F0B" };
const shadow = { shadowColor: "#3A2A33", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 } as const;

export default function RegistroMedicamentoView() {
    const router = useRouter();
    const { atendimentoId = "", idosoNome = "Pessoa cuidada", prestadorId = "1" } = useLocalSearchParams<{ atendimentoId?: string; idosoNome?: string; prestadorId?: string }>();
    const [records, setRecords] = useState<RegistroAtendimento[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try { setRecords(await listarRegistrosAtendimento(String(atendimentoId), "MEDICAMENTO")); }
        catch { Alert.alert("Não foi possível carregar", "Tente novamente."); }
        finally { setLoading(false); }
    }, [atendimentoId]);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    function openForm(record?: RegistroAtendimento) {
        router.push({
            pathname: "/registro-medicamento-form",
            params: { atendimentoId: String(atendimentoId), idosoNome: String(idosoNome), prestadorId: String(prestadorId), registroId: record?.id_registro },
        });
    }

    function confirmDelete(record: RegistroAtendimento) {
        Alert.alert("Excluir medicamento", `Excluir o registro de ${String(record.dados?.medicamento ?? "medicamento")}?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: async () => { await excluirRegistroAtendimento(String(atendimentoId), record.id_registro); await load(); } },
        ]);
    }

    function openMenu(record: RegistroAtendimento) {
        const administered = Boolean(record.dados?.administrado);
        Alert.alert(String(record.dados?.medicamento ?? "Medicamento"), "O que você quer fazer?", [
            { text: administered ? "Marcar como pendente" : "Marcar como administrado", onPress: async () => { await salvarRegistroAtendimento(String(atendimentoId), String(prestadorId), { dados: { ...record.dados, administrado: !administered }, descricao: `${String(record.dados?.medicamento ?? "Medicamento")} ${String(record.dados?.dosagem ?? "")} ${!administered ? "administrado" : "não administrado"}`, registroId: record.id_registro, tipo: "MEDICAMENTO" }); await load(); } },
            { text: "Editar", onPress: () => openForm(record) },
            { text: "Excluir", style: "destructive", onPress: () => confirmDelete(record) },
            { text: "Cancelar", style: "cancel" },
        ]);
    }

    function renderItem({ item }: { item: RegistroAtendimento }) {
        const administered = Boolean(item.dados?.administrado);
        return <View style={[styles.card, shadow]}>
            <View style={styles.iconBox}><MaterialCommunityIcons name="pill" size={20} color={colors.primary} /></View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{String(item.dados?.medicamento ?? "Medicamento")}</Text>
                <Text style={styles.cardMeta}>{[item.dados?.dosagem, item.dados?.horario].filter(Boolean).map(String).join(" · ")}</Text>
                <View style={[styles.badge, { backgroundColor: administered ? colors.okBg : colors.pendingBg }]}><Text style={[styles.badgeText, { color: administered ? colors.okText : colors.pendingText }]}>{administered ? "Administrado" : "Pendente"}</Text></View>
            </View>
            <Pressable style={styles.menuButton} onPress={() => openMenu(item)} accessibilityLabel={`Opções de ${String(item.dados?.medicamento ?? "medicamento")}`}><Feather name="menu" size={18} color={colors.text} /></Pressable>
        </View>;
    }

    return <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Voltar"><Feather name="chevron-left" size={22} color={colors.text} /></Pressable>
            <View><Text style={styles.title}>Medicamentos</Text><Text style={styles.subtitle}>{String(idosoNome)}</Text></View>
        </View>
        <FlatList data={records} keyExtractor={(item) => item.id_registro} renderItem={renderItem} contentContainerStyle={styles.list}
            ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : <Text style={styles.empty}>Nenhum medicamento registrado. Toque em &quot;Registrar medicamento&quot; para começar.</Text>}
            ListFooterComponent={<Pressable style={({ pressed }) => [styles.primaryButton, shadow, pressed && { opacity: 0.85 }]} onPress={() => openForm()}><Feather name="plus" size={18} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Registrar medicamento</Text></Pressable>}
        />
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, width: "100%", maxWidth: 620, alignSelf: "center" },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 18, fontWeight: "600", color: colors.text }, subtitle: { fontSize: 12, color: colors.muted },
    list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10, width: "100%", maxWidth: 620, alignSelf: "center", flexGrow: 1 },
    card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    iconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
    cardInfo: { flex: 1, gap: 3 }, cardTitle: { fontSize: 13, fontWeight: "700", color: colors.text }, cardMeta: { fontSize: 10, color: colors.muted },
    badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 }, badgeText: { fontSize: 9, fontWeight: "500" },
    menuButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
    primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, backgroundColor: colors.primary, marginTop: 6 },
    primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" }, empty: { textAlign: "center", color: colors.muted, fontSize: 13, paddingVertical: 24 }, loader: { paddingVertical: 24 },
});
