import { buscarJanelaAtendimento, formatarHorarioAtendimento, horarioPertenceAoAtendimento, listarRegistrosAtendimento, salvarRegistroAtendimento, type JanelaAtendimento } from "@/features/app_prestador/atendimento/service/api_atendimento";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = { background: "#F7F4EC", card: "#FFFEF8", primary: "#77325F", border: "#E6E0D4", text: "#1E1A1D", muted: "#8A8580", placeholder: "#A9A39C", danger: "#A32D2D" };
const shadow = { shadowColor: "#3A2A33", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 } as const;
const maskTime = (value: string) => { const digits = value.replace(/\D/g, "").slice(0, 4); return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`; };
const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const currentDate = () => new Intl.DateTimeFormat("pt-BR").format(new Date());
type Errors = { name?: string; dosage?: string; time?: string };

export default function RegistroMedicamentoFormView() {
    const router = useRouter();
    const { atendimentoId = "", idosoNome = "Pessoa cuidada", prestadorId = "1", registroId } = useLocalSearchParams<{ atendimentoId?: string; idosoNome?: string; prestadorId?: string; registroId?: string }>();
    const editing = Boolean(registroId);
    const [name, setName] = useState("");
    const [dosage, setDosage] = useState("");
    const [time, setTime] = useState("");
    const [administered, setAdministered] = useState(true);
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const [attendanceWindow, setAttendanceWindow] = useState<JanelaAtendimento | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void Promise.all([
            buscarJanelaAtendimento(String(atendimentoId), controller.signal),
            registroId ? listarRegistrosAtendimento(String(atendimentoId), "MEDICAMENTO", controller.signal) : Promise.resolve([]),
        ]).then(([window, records]) => {
            setAttendanceWindow(window);
            const record = records.find((item) => item.id_registro === String(registroId));
            if (record) {
                setName(String(record.dados?.medicamento ?? ""));
                setDosage(String(record.dados?.dosagem ?? ""));
                setTime(String(record.dados?.horario ?? ""));
                setAdministered(Boolean(record.dados?.administrado));
                setNotes(String(record.dados?.observacoes ?? ""));
            }
        }).catch(() => { if (!controller.signal.aborted) Alert.alert("Não foi possível carregar", "Tente novamente."); });
        return () => controller.abort();
    }, [atendimentoId, registroId]);

    function validate() {
        const next: Errors = {};
        if (!name.trim()) next.name = "Informe o nome do medicamento.";
        if (!dosage.trim()) next.dosage = "Informe a dosagem. Exemplo: 50 mg.";
        if (!validTime(time)) next.time = "Use o formato HH:MM. Exemplo: 22:30.";
        else if (!attendanceWindow) next.time = "Não foi possível identificar o horário do atendimento.";
        else if (!horarioPertenceAoAtendimento(time, attendanceWindow)) next.time = `Informe um horário entre ${formatarHorarioAtendimento(attendanceWindow.inicio)} e ${formatarHorarioAtendimento(attendanceWindow.fim)}.`;
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function save() {
        if (!validate()) return;
        setSaving(true);
        try {
            await salvarRegistroAtendimento(String(atendimentoId), String(prestadorId), {
                dados: { administrado: administered, data: currentDate(), dosagem: dosage.trim(), horario: time, medicamento: name.trim(), observacoes: notes.trim() },
                descricao: `${name.trim()} ${dosage.trim()} ${administered ? "administrado" : "não administrado"}`,
                registroId: registroId ? String(registroId) : undefined,
                tipo: "MEDICAMENTO",
            });
            router.back();
        } catch { Alert.alert("Não foi possível salvar", "Tente novamente."); }
        finally { setSaving(false); }
    }

    return <SafeAreaView edges={["top"]} style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Voltar"><Feather name="chevron-left" size={22} color={colors.text} /></Pressable>
                <View><Text style={styles.title}>{editing ? "Editar medicamento" : "Registrar medicamento"}</Text><Text style={styles.subtitle}>{String(idosoNome)}</Text></View>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Medicamento</Text>
                <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Nome do medicamento" placeholderTextColor={colors.placeholder} value={name} onChangeText={setName} />
                {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
                <Text style={styles.label}>Dosagem</Text>
                <TextInput style={[styles.input, errors.dosage && styles.inputError]} placeholder="Ex: 50 mg" placeholderTextColor={colors.placeholder} value={dosage} onChangeText={setDosage} />
                {errors.dosage ? <Text style={styles.error}>{errors.dosage}</Text> : null}
                <Text style={styles.label}>Horário</Text>
                <TextInput style={[styles.input, errors.time && styles.inputError]} placeholder="22:30" placeholderTextColor={colors.placeholder} keyboardType="number-pad" inputMode="numeric" maxLength={5} value={time} onChangeText={(value) => setTime(maskTime(value))} />
                {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
                {!errors.time && attendanceWindow ? <Text style={styles.hint}>Horário permitido: {formatarHorarioAtendimento(attendanceWindow.inicio)} até {formatarHorarioAtendimento(attendanceWindow.fim)}</Text> : null}
                <Text style={styles.label}>Foi administrado?</Text>
                <View style={styles.toggleRow}>{[{ label: "Sim", value: true }, { label: "Não", value: false }].map((option) => { const active = administered === option.value; return <Pressable key={option.label} style={[styles.toggle, active && styles.toggleActive]} onPress={() => setAdministered(option.value)} accessibilityRole="radio" accessibilityState={{ selected: active }}><Text style={[styles.toggleText, active && styles.toggleTextActive]}>{option.label}</Text></Pressable>; })}</View>
                <Text style={styles.label}>Observações</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="Informações adicionais" placeholderTextColor={colors.placeholder} multiline textAlignVertical="top" value={notes} onChangeText={setNotes} />
                <Pressable style={({ pressed }) => [styles.primaryButton, shadow, (pressed || saving) && { opacity: 0.85 }]} onPress={() => void save()} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editing ? "Salvar alterações" : "Salvar registro"}</Text>}</Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    flex: { flex: 1 }, safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, width: "100%", maxWidth: 620, alignSelf: "center" },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 18, fontWeight: "600", color: colors.text }, subtitle: { fontSize: 12, color: colors.muted },
    form: { paddingHorizontal: 16, paddingBottom: 32, width: "100%", maxWidth: 620, alignSelf: "center" },
    label: { fontSize: 13, color: colors.text, marginTop: 14, marginBottom: 6 },
    input: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, fontSize: 13, color: colors.text },
    inputError: { borderColor: colors.danger }, error: { fontSize: 12, color: colors.danger, marginTop: 4 }, hint: { fontSize: 11, color: colors.muted, marginTop: 5 }, textarea: { height: 96, paddingTop: 12 },
    toggleRow: { flexDirection: "row", gap: 12 }, toggle: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
    toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary }, toggleText: { fontSize: 12, color: colors.text }, toggleTextActive: { color: "#FFFFFF" },
    primaryButton: { height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 20 }, primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
});
