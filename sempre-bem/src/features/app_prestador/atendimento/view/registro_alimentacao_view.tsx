import { buscarJanelaAtendimento, excluirRegistroAtendimento, formatarHorarioAtendimento, horarioPertenceAoAtendimento, listarRegistrosAtendimento, salvarRegistroAtendimento, type JanelaAtendimento, type RegistroAtendimento } from "@/features/app_prestador/atendimento/service/api_atendimento";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCEPTANCE_OPTIONS = ["Boa", "Parcial", "Baixa", "Recusou"];
const currentDate = () => new Intl.DateTimeFormat("pt-BR").format(new Date());
const maskTime = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export default function RegistroAlimentacaoView() {
    const router = useRouter();
    const { atendimentoId = "", idosoNome = "Pessoa cuidada", prestadorId = "1" } = useLocalSearchParams<{ atendimentoId?: string; idosoNome?: string; prestadorId?: string }>();
    const [meal, setMeal] = useState("");
    const [time, setTime] = useState("");
    const [foods, setFoods] = useState("");
    const [acceptance, setAcceptance] = useState("Boa");
    const [notes, setNotes] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [records, setRecords] = useState<RegistroAtendimento[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendanceWindow, setAttendanceWindow] = useState<JanelaAtendimento | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [nextRecords, window] = await Promise.all([
                listarRegistrosAtendimento(String(atendimentoId), "ALIMENTACAO"),
                buscarJanelaAtendimento(String(atendimentoId)),
            ]);
            setRecords(nextRecords);
            setAttendanceWindow(window);
        }
        catch { Alert.alert("Não foi possível carregar", "Tente novamente."); }
        finally { setLoading(false); }
    }, [atendimentoId]);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    function clearForm() {
        setMeal(""); setTime(""); setFoods(""); setAcceptance("Boa"); setNotes(""); setEditingId(null);
    }

    async function save() {
        if (!meal.trim() || !foods.trim()) {
            Alert.alert("Atenção", "Por favor, preencha pelo menos a refeição e os alimentos.");
            return;
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            Alert.alert("Horário inválido", "Informe um horário válido no formato HH:MM.");
            return;
        }
        if (!attendanceWindow) {
            Alert.alert("Atendimento indisponível", "Não foi possível identificar o horário deste atendimento.");
            return;
        }
        if (!horarioPertenceAoAtendimento(time, attendanceWindow)) {
            Alert.alert("Horário fora do atendimento", `Informe um horário entre ${formatarHorarioAtendimento(attendanceWindow.inicio)} e ${formatarHorarioAtendimento(attendanceWindow.fim)}.`);
            return;
        }
        const wasEditing = Boolean(editingId);
        setSaving(true);
        try {
            await salvarRegistroAtendimento(String(atendimentoId), String(prestadorId), {
                dados: { aceitacao: acceptance, alimentos: foods.trim(), data: currentDate(), horario: time.trim(), observacoes: notes.trim(), refeicao: meal.trim() },
                descricao: `${meal.trim()}: ${foods.trim()} · aceitação ${acceptance.toLowerCase()}`,
                registroId: editingId ?? undefined,
                tipo: "ALIMENTACAO",
            });
            clearForm();
            await load();
            Alert.alert("Sucesso", wasEditing ? "Registro atualizado com sucesso!" : "Registro salvo com sucesso!");
        } catch { Alert.alert("Não foi possível salvar", "Tente novamente."); }
        finally { setSaving(false); }
    }

    function startEditing(record: RegistroAtendimento) {
        setEditingId(record.id_registro);
        setMeal(String(record.dados?.refeicao ?? ""));
        setTime(String(record.dados?.horario ?? ""));
        setFoods(String(record.dados?.alimentos ?? ""));
        setAcceptance(String(record.dados?.aceitacao ?? "Boa"));
        setNotes(String(record.dados?.observacoes ?? ""));
    }

    function remove(record: RegistroAtendimento) {
        Alert.alert("Excluir alimentação", "Deseja remover este registro?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: async () => { await excluirRegistroAtendimento(String(atendimentoId), record.id_registro); if (editingId === record.id_registro) clearForm(); await load(); } },
        ]);
    }

    return <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTitleGroup}><Text style={styles.headerTitle}>Registrar alimentação</Text><Text style={styles.headerSubtitle}>{String(idosoNome)}</Text></View>
            </View>
            <View style={styles.formCard}>
                <Text style={styles.label}>Tipo de refeição</Text>
                <TextInput style={styles.input} placeholder="Ex: Almoço" placeholderTextColor="#B0A8A0" value={meal} onChangeText={setMeal} />
                <Text style={styles.label}>Horário</Text>
                <TextInput style={styles.input} placeholder="Ex: 22:30" placeholderTextColor="#B0A8A0" keyboardType="number-pad" inputMode="numeric" maxLength={5} value={time} onChangeText={(value) => setTime(maskTime(value))} />
                {attendanceWindow ? <Text style={styles.timeHint}>Horário permitido: {formatarHorarioAtendimento(attendanceWindow.inicio)} até {formatarHorarioAtendimento(attendanceWindow.fim)}</Text> : null}
                <Text style={styles.label}>Alimentos consumidos</Text>
                <TextInput style={[styles.input, styles.foodArea]} placeholder="Descreva os alimentos" placeholderTextColor="#B0A8A0" multiline numberOfLines={4} value={foods} onChangeText={setFoods} />
                <Text style={styles.label}>Quantidade / aceitação</Text>
                <View style={styles.acceptanceContainer}>{ACCEPTANCE_OPTIONS.map((option) => { const selected = acceptance === option; return <TouchableOpacity key={option} style={[styles.acceptanceButton, selected && styles.acceptanceButtonSelected]} onPress={() => setAcceptance(option)}><Text style={[styles.acceptanceText, selected && styles.acceptanceTextSelected]}>{option}</Text></TouchableOpacity>; })}</View>
                <Text style={styles.label}>Observações</Text>
                <TextInput style={[styles.input, styles.notesArea]} placeholder="Informações adicionais" placeholderTextColor="#B0A8A0" multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
                <TouchableOpacity style={styles.saveButton} onPress={() => void save()} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>{editingId ? "Atualizar registro" : "Salvar registro"}</Text>}</TouchableOpacity>
                {editingId ? <TouchableOpacity style={styles.cancelButton} onPress={clearForm}><Text style={styles.cancelButtonText}>Cancelar Edição</Text></TouchableOpacity> : null}
            </View>
            <Text style={styles.historyTitle}>📜 Histórico de Registros</Text>
            {loading ? <ActivityIndicator color="#6B3564" /> : records.length === 0 ? <Text style={styles.emptyText}>Nenhum registro de alimentação salvo.</Text> : records.map((record) => <View key={record.id_registro} style={styles.itemCard}>
                <View style={styles.itemHeader}><Text style={styles.itemMeal}>{String(record.dados?.refeicao ?? "Refeição")}</Text><Text style={styles.itemTime}>{String(record.dados?.data ?? "")} às {String(record.dados?.horario ?? "")}</Text></View>
                <Text style={styles.itemText}><Text style={styles.bold}>Alimentos: </Text>{String(record.dados?.alimentos ?? record.descricao)}</Text>
                <Text style={styles.itemText}><Text style={styles.bold}>Aceitação: </Text>{String(record.dados?.aceitacao ?? "Não informada")}</Text>
                {record.dados?.observacoes ? <Text style={styles.itemText}><Text style={styles.bold}>Obs: </Text>{String(record.dados.observacoes)}</Text> : null}
                <View style={styles.actions}><TouchableOpacity style={styles.editButton} onPress={() => startEditing(record)}><Text style={styles.actionText}>✏️ Editar</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => remove(record)}><Text style={styles.actionText}>🗑️ Excluir</Text></TouchableOpacity></View>
            </View>)}
        </ScrollView>
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F4EC" },
    container: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40, backgroundColor: "#F7F4EC", flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
    headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginRight: 16, elevation: 2 },
    backText: { fontSize: 28, color: "#222222", marginTop: -2 },
    headerTitleGroup: { justifyContent: "center" }, headerTitle: { fontSize: 22, fontWeight: "bold", color: "#222222" }, headerSubtitle: { fontSize: 15, color: "#888888", marginTop: 2 },
    formCard: { marginBottom: 24 }, label: { fontSize: 15, fontWeight: "600", color: "#222222", marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E0DDD5", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#222222" },
    timeHint: { color: "#888888", fontSize: 11, marginTop: 5 }, foodArea: { height: 90, textAlignVertical: "top" }, notesArea: { height: 80, textAlignVertical: "top" },
    acceptanceContainer: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 },
    acceptanceButton: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#E0DDD5", backgroundColor: "#FFFFFF", alignItems: "center" },
    acceptanceButtonSelected: { backgroundColor: "#6B3564", borderColor: "#6B3564" }, acceptanceText: { fontSize: 13, color: "#666666", fontWeight: "500" }, acceptanceTextSelected: { color: "#FFFFFF", fontWeight: "600" },
    saveButton: { backgroundColor: "#6B3564", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 20 }, saveButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
    cancelButton: { paddingVertical: 12, alignItems: "center", marginTop: 8 }, cancelButtonText: { color: "#E53E3E", fontWeight: "600" },
    historyTitle: { fontSize: 18, fontWeight: "bold", color: "#222222", marginBottom: 14, marginTop: 10 }, emptyText: { color: "#888888", fontStyle: "italic", textAlign: "center", marginTop: 10 },
    itemCard: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: "#6B3564", elevation: 2 },
    itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, itemMeal: { fontSize: 16, fontWeight: "bold", color: "#222222" }, itemTime: { fontSize: 13, color: "#888888", fontWeight: "600" },
    itemText: { fontSize: 14, color: "#444444", marginBottom: 4 }, bold: { fontWeight: "bold" },
    actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F0EEDF" },
    editButton: { backgroundColor: "#ED8936", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }, deleteButton: { backgroundColor: "#E53E3E", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }, actionText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
});
