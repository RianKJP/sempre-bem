import { buscarJanelaAtendimento, excluirRegistroAtendimento, formatarHorarioAtendimento, horarioPertenceAoAtendimento, listarRegistrosAtendimento, salvarRegistroAtendimento, type JanelaAtendimento, type RegistroAtendimento } from "@/features/app_prestador/atendimento/service/api_atendimento";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES = ["Acompanhamento diário", "Consulta médica", "Medicamento", "Alimentação", "Atividade recreativa", "Observação"];
type Tab = "formulario" | "registros";
const formatDate = (iso: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
const formatTime = (iso: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const today = () => new Intl.DateTimeFormat("pt-BR").format(new Date());
const maskTime = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export default function RegistroDiarioView() {
    const router = useRouter();
    const { atendimentoId = "", idosoNome = "Pessoa cuidada", prestadorId = "1" } = useLocalSearchParams<{ atendimentoId?: string; idosoNome?: string; prestadorId?: string }>();
    const [tab, setTab] = useState<Tab>("formulario");
    const [records, setRecords] = useState<RegistroAtendimento[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [person, setPerson] = useState(String(idosoNome));
    const [type, setType] = useState("");
    const [time, setTime] = useState("");
    const [description, setDescription] = useState("");
    const [activities, setActivities] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendanceWindow, setAttendanceWindow] = useState<JanelaAtendimento | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [observations, others, window] = await Promise.all([
                listarRegistrosAtendimento(String(atendimentoId), "OBSERVACAO"),
                listarRegistrosAtendimento(String(atendimentoId), "OUTRO"),
                buscarJanelaAtendimento(String(atendimentoId)),
            ]);
            setRecords([...observations, ...others].sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em)));
            setAttendanceWindow(window);
        } catch { Alert.alert("Não foi possível carregar", "Tente novamente."); }
        finally { setLoading(false); }
    }, [atendimentoId]);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    const filteredRecords = useMemo(() => records.filter((record) => String(record.dados?.idoso ?? idosoNome).toLowerCase().includes(search.toLowerCase())), [idosoNome, records, search]);

    function clearFields() {
        setPerson(String(idosoNome)); setType(""); setTime(""); setDescription(""); setActivities(""); setEditingId(null);
    }

    async function save() {
        if (!person.trim() || !type || !time.trim()) {
            Alert.alert("Campos obrigatórios", "Preencha o nome do idoso, o tipo de atendimento e o horário.");
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
                dados: { atividades: activities.trim(), categoria: type, data: today(), horario: time.trim(), idoso: person.trim() },
                descricao: description.trim(),
                registroId: editingId ?? undefined,
                tipo: "OBSERVACAO",
            });
            clearFields();
            await load();
            setTab("registros");
            Alert.alert("Sucesso", wasEditing ? "Registro atualizado!" : "Registro cadastrado!");
        } catch { Alert.alert("Não foi possível salvar", "Tente novamente."); }
        finally { setSaving(false); }
    }

    function edit(record: RegistroAtendimento) {
        setPerson(String(record.dados?.idoso ?? idosoNome));
        setType(String(record.dados?.categoria ?? ""));
        setTime(String(record.dados?.horario ?? formatTime(record.criado_em)));
        setDescription(record.descricao);
        setActivities(String(record.dados?.atividades ?? ""));
        setEditingId(record.id_registro);
        setTab("formulario");
    }

    function remove(record: RegistroAtendimento) {
        Alert.alert("Excluir registro", "Deseja realmente excluir este atendimento?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: async () => { await excluirRegistroAtendimento(String(atendimentoId), record.id_registro); await load(); } },
        ]);
    }

    return <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F4EC" />
        <View style={styles.container}><ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={25} color="#783A70" /></TouchableOpacity>
                <View style={styles.headerText}><Text style={styles.title}>Diário de Bordo</Text><Text style={styles.subtitle}>Registre os atendimentos e acompanhe a rotina de cuidados do idoso.</Text></View>
                <Feather name="calendar" size={24} color="#783A70" />
            </View>
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === "formulario" && styles.activeTab]} onPress={() => setTab("formulario")}><Feather name="edit-3" size={18} color={tab === "formulario" ? "#783A70" : "#887D86"} /><Text style={[styles.tabText, tab === "formulario" && styles.activeTabText]}>Novo Registro</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === "registros" && styles.activeTab]} onPress={() => setTab("registros")}><Feather name="list" size={19} color={tab === "registros" ? "#783A70" : "#887D86"} /><Text style={[styles.tabText, tab === "registros" && styles.activeTabText]}>Registros</Text></TouchableOpacity>
            </View>

            {tab === "formulario" ? <View style={styles.formCard}>
                <View style={styles.formHeader}><View style={styles.formIcon}><Ionicons name="clipboard-outline" size={29} color="#783A70" /></View><View style={styles.flex}><Text style={styles.formTitle}>{editingId ? "Editar Registro" : "Novo Registro"}</Text><Text style={styles.formSubtitle}>Preencha as informações do atendimento.</Text></View></View>
                <View style={styles.formBody}>
                    <Text style={styles.label}><Ionicons name="person-outline" size={17} color="#783A70" />{"  "}Idoso(a)</Text><View style={styles.inputBox}><Ionicons name="person-outline" size={21} color="#783A70" /><TextInput style={styles.input} placeholder="Digite o nome do idoso(a)" placeholderTextColor="#999099" value={person} onChangeText={setPerson} /></View>
                    <Text style={styles.label}><Feather name="list" size={17} color="#783A70" />{"  "}Tipo de atendimento</Text><View style={styles.typeOptions}>{TYPES.map((option) => <TouchableOpacity key={option} style={[styles.typeOption, type === option && styles.selectedType]} onPress={() => setType(option)}><Text style={[styles.typeOptionText, type === option && styles.selectedTypeText]}>{option}</Text></TouchableOpacity>)}</View>
                    <Text style={styles.label}><Feather name="clock" size={16} color="#783A70" />{"  "}Horário</Text>
                    <View style={styles.inputBox}><Feather name="clock" size={19} color="#783A70" /><TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor="#999099" keyboardType="number-pad" inputMode="numeric" maxLength={5} value={time} onChangeText={(value) => setTime(maskTime(value))} /></View>
                    {attendanceWindow ? <Text style={styles.timeHint}>Horário permitido: {formatarHorarioAtendimento(attendanceWindow.inicio)} até {formatarHorarioAtendimento(attendanceWindow.fim)}</Text> : null}
                    <Text style={styles.label}><Feather name="file-text" size={17} color="#783A70" />{"  "}Descrição do ocorrido</Text><TextInput style={[styles.textArea, styles.descriptionArea]} placeholder="Descreva o que aconteceu durante o atendimento..." placeholderTextColor="#999099" multiline textAlignVertical="top" maxLength={500} value={description} onChangeText={setDescription} /><Text style={styles.charCount}>{description.length}/500</Text>
                    <Text style={styles.label}><Feather name="heart" size={18} color="#783A70" />{"  "}Atividades realizadas</Text><TextInput style={[styles.textArea, styles.activitiesArea]} placeholder="Informe as atividades realizadas..." placeholderTextColor="#999099" multiline textAlignVertical="top" maxLength={500} value={activities} onChangeText={setActivities} /><Text style={styles.charCount}>{activities.length}/500</Text>
                    <TouchableOpacity style={styles.saveButton} onPress={() => void save()} disabled={saving}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name={editingId ? "checkmark-circle-outline" : "add-circle-outline"} size={23} color="#FFFFFF" /><Text style={styles.saveButtonText}>{editingId ? "Salvar alterações" : "Cadastrar Registro"}</Text></>}</TouchableOpacity>
                    <TouchableOpacity style={styles.clearButton} onPress={clearFields}><Feather name="refresh-cw" size={19} color="#783A70" /><Text style={styles.clearButtonText}>Limpar Campos</Text></TouchableOpacity>
                </View>
            </View> : <View>
                <View style={styles.searchRow}><View style={styles.searchBox}><Feather name="search" size={20} color="#887D86" /><TextInput style={styles.searchInput} placeholder="Buscar por nome do idoso..." placeholderTextColor="#999099" value={search} onChangeText={setSearch} /></View></View>
                <View style={styles.listHeading}><Text style={styles.listTitle}>Registros cadastrados</Text><Text style={styles.listCount}>{filteredRecords.length} registros</Text></View>
                {loading ? <ActivityIndicator color="#783A70" /> : filteredRecords.map((record) => <View key={record.id_registro} style={styles.listCard}>
                    <View style={styles.listCardHeader}><View style={styles.listAvatar}><Ionicons name="person-outline" size={25} color="#783A70" /></View><View style={styles.listPerson}><Text style={styles.listPersonName}>{String(record.dados?.idoso ?? idosoNome)}</Text><View style={styles.listTypeBadge}><Text style={styles.listTypeText}>{String(record.dados?.categoria ?? "Observação")}</Text></View></View><View style={styles.dateColumn}><Text style={styles.dateText}>{String(record.dados?.data ?? formatDate(record.criado_em))}</Text><Text style={styles.dateText}>{String(record.dados?.horario ?? formatTime(record.criado_em))}</Text></View></View>
                    <View style={styles.detailRow}><Feather name="file-text" size={20} color="#783A70" /><View style={styles.detailContent}><Text style={styles.detailTitle}>Descrição</Text><Text style={styles.detailText}>{record.descricao || "Nenhuma descrição informada."}</Text></View></View>
                    <View style={styles.detailRow}><Feather name="heart" size={20} color="#783A70" /><View style={styles.detailContent}><Text style={styles.detailTitle}>Atividades</Text><Text style={styles.detailText}>{String(record.dados?.atividades ?? "Nenhuma atividade informada.")}</Text></View></View>
                    <View style={styles.actionRow}><TouchableOpacity style={styles.editButton} onPress={() => edit(record)}><Feather name="edit-2" size={17} color="#783A70" /><Text style={styles.editButtonText}>Editar</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => remove(record)}><Feather name="trash-2" size={17} color="#B64242" /><Text style={styles.deleteButtonText}>Excluir</Text></TouchableOpacity></View>
                </View>)}
                {!loading && filteredRecords.length === 0 ? <View style={styles.emptyState}><Feather name="inbox" size={35} color="#887D86" /><Text style={styles.emptyTitle}>Nenhum registro encontrado</Text><Text style={styles.emptyText}>Tente buscar por outro nome ou cadastre um novo atendimento.</Text></View> : null}
                <TouchableOpacity style={styles.newRecordButton} onPress={() => { clearFields(); setTab("formulario"); }}><Ionicons name="add" size={22} color="#FFFFFF" /><Text style={styles.newRecordText}>Adicionar registro</Text></TouchableOpacity>
            </View>}
            <View style={styles.infoCard}><View style={styles.infoIcon}><Ionicons name="information" size={19} color="#783A70" /></View><View style={styles.flex}><Text style={styles.infoTitle}>Importante</Text><Text style={styles.infoText}>Registre os atendimentos com detalhes para garantir um acompanhamento mais completo.</Text></View></View>
        </ScrollView></View>
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F4EC" }, container: { flex: 1, backgroundColor: "#F7F4EC" }, scroll: { flex: 1 }, flex: { flex: 1 },
    content: { paddingHorizontal: 17, paddingTop: 35, paddingBottom: 28, width: "100%", maxWidth: 620, alignSelf: "center" },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 22 }, backButton: { width: 38, height: 42, justifyContent: "center", marginRight: 10 }, headerText: { flex: 1, marginRight: 8 }, title: { color: "#783A70", fontSize: 23, fontWeight: "700" }, subtitle: { color: "#827780", fontSize: 12, lineHeight: 18, marginTop: 4 },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#DED5DC", marginBottom: 19 }, tab: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: "transparent" }, activeTab: { borderBottomColor: "#783A70" }, tabText: { fontSize: 13, color: "#887D86", fontWeight: "500" }, activeTabText: { color: "#783A70", fontWeight: "700" },
    formCard: { backgroundColor: "#FFFEFC", borderRadius: 21, borderWidth: 1, borderColor: "#E2D9D8", overflow: "hidden", shadowColor: "#392D35", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 7, elevation: 2 },
    formHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#F3EAF2", borderBottomWidth: 1, borderBottomColor: "#E8DCE6" }, formIcon: { width: 49, height: 49, borderRadius: 15, backgroundColor: "#E8D9E6", alignItems: "center", justifyContent: "center" }, formTitle: { fontSize: 18, fontWeight: "700", color: "#783A70" }, formSubtitle: { fontSize: 12, color: "#827780", marginTop: 4 }, formBody: { padding: 16 },
    label: { color: "#302A30", fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 9 }, inputBox: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: "#DED6D9", backgroundColor: "#FFFEFC", marginBottom: 16 }, input: { flex: 1, color: "#302A30", fontSize: 14, paddingVertical: 10 },
    typeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }, typeOption: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "#E2D9E0", backgroundColor: "#FFFEFC" }, selectedType: { backgroundColor: "#F3EAF2", borderColor: "#783A70" }, typeOptionText: { fontSize: 11, color: "#756A73" }, selectedTypeText: { color: "#783A70", fontWeight: "700" },
    timeHint: { color: "#827780", fontSize: 11, marginTop: -9, marginBottom: 12 }, textArea: { borderWidth: 1, borderColor: "#DED6D9", borderRadius: 13, backgroundColor: "#FFFEFC", padding: 13, fontSize: 14, color: "#302A30", lineHeight: 21 }, descriptionArea: { height: 110 }, activitiesArea: { height: 105 }, charCount: { textAlign: "right", color: "#928790", fontSize: 11, marginTop: 5, marginBottom: 10 },
    saveButton: { minHeight: 54, backgroundColor: "#783A70", borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 12 }, saveButtonText: { fontSize: 15, color: "#FFFFFF", fontWeight: "700" }, clearButton: { minHeight: 49, borderWidth: 1, borderColor: "#DCCBD9", borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 10 }, clearButtonText: { fontSize: 14, color: "#783A70", fontWeight: "600" },
    searchRow: { marginBottom: 17 }, searchBox: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, borderWidth: 1, borderColor: "#DED6D9", borderRadius: 13, backgroundColor: "#FFFEFC" }, searchInput: { flex: 1, fontSize: 13, color: "#302A30", paddingVertical: 10 }, listHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }, listTitle: { color: "#302A30", fontSize: 16, fontWeight: "700" }, listCount: { color: "#783A70", fontSize: 11, fontWeight: "600" },
    listCard: { backgroundColor: "#FFFEFC", borderRadius: 19, borderWidth: 1, borderColor: "#E2D9D8", padding: 14, marginBottom: 15, shadowColor: "#392D35", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }, listCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 17 }, listAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#F0E5EF", alignItems: "center", justifyContent: "center", marginRight: 10 }, listPerson: { flex: 1 }, listPersonName: { color: "#302A30", fontSize: 14, fontWeight: "700", marginBottom: 6 }, listTypeBadge: { alignSelf: "flex-start", backgroundColor: "#F3EAF2", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 }, listTypeText: { color: "#783A70", fontSize: 10, fontWeight: "600" }, dateColumn: { alignItems: "flex-end", gap: 7, marginLeft: 5 }, dateText: { color: "#827780", fontSize: 10 },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 }, detailContent: { flex: 1 }, detailTitle: { color: "#302A30", fontSize: 13, fontWeight: "700", marginBottom: 3 }, detailText: { color: "#756D75", fontSize: 12, lineHeight: 18 }, actionRow: { flexDirection: "row", gap: 10, marginTop: 2 },
    editButton: { flex: 1, minHeight: 43, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 11, backgroundColor: "#F3EAF2" }, editButtonText: { color: "#783A70", fontSize: 13, fontWeight: "700" }, deleteButton: { flex: 1, minHeight: 43, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 11, backgroundColor: "#F9EAEA" }, deleteButtonText: { color: "#B64242", fontSize: 13, fontWeight: "700" },
    emptyState: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 35, backgroundColor: "#FFFEFC", borderRadius: 18, borderWidth: 1, borderColor: "#E2D9D8" }, emptyTitle: { fontSize: 15, fontWeight: "700", color: "#302A30", marginTop: 12 }, emptyText: { fontSize: 12, lineHeight: 18, textAlign: "center", color: "#827780", marginTop: 6 },
    newRecordButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#783A70", borderRadius: 14, marginTop: 4 }, newRecordText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    infoCard: { flexDirection: "row", backgroundColor: "#F3EAF2", borderWidth: 1, borderColor: "#E5D6E2", borderRadius: 15, padding: 13, marginTop: 18 }, infoIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#E8D9E6", alignItems: "center", justifyContent: "center", marginRight: 10 }, infoTitle: { color: "#783A70", fontSize: 13, fontWeight: "700", marginBottom: 4 }, infoText: { color: "#756A73", fontSize: 11, lineHeight: 17 },
});
