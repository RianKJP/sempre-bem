import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatBrazilianPhone } from "@/core/utils/phone";
import { PROFESSIONAL_SPECIALTIES } from "@/features/cadastro_profissional/state/professional_draft";
import { validateProviderProfile, type ProviderProfileErrors, type ProviderProfileInput } from "@/features/perfil_prestador/state/profile";

export function EditProviderProfileModal({ initialValue, onClose, onSave }: { initialValue: ProviderProfileInput; onClose: () => void; onSave: (value: ProviderProfileInput) => Promise<unknown> }) {
    const [draft, setDraft] = useState<ProviderProfileInput>({ ...initialValue, specialties: [...initialValue.specialties] });
    const [errors, setErrors] = useState<ProviderProfileErrors>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string>();
    const update = <K extends keyof ProviderProfileInput>(key: K, value: ProviderProfileInput[K]) => { setDraft((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); setSaveError(undefined); };

    async function save() {
        const next = validateProviderProfile(draft);
        setErrors(next);
        if (Object.keys(next).length) return;
        setSaving(true);
        try { await onSave(draft); onClose(); }
        catch (failure) { setSaveError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
        finally { setSaving(false); }
    }

    function toggleSpecialty(specialty: string) {
        update("specialties", draft.specialties.includes(specialty) ? draft.specialties.filter((item) => item !== specialty) : [...draft.specialties, specialty]);
    }

    return <Modal animationType="slide" onRequestClose={onClose} visible><SafeAreaView style={styles.screen}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Text style={styles.title}>Editar perfil profissional</Text><Pressable onPress={onClose}><Text style={styles.close}>Fechar</Text></Pressable></View>
        <Field error={errors.name} label="Nome completo" onChangeText={(value) => update("name", value)} value={draft.name} />
        <Field autoCapitalize="none" error={errors.email} keyboardType="email-address" label="E-mail" onChangeText={(value) => update("email", value)} value={draft.email} />
        <Field error={errors.phone} keyboardType="phone-pad" label="Telefone" maxLength={15} onChangeText={(value) => update("phone", formatBrazilianPhone(value))} value={formatBrazilianPhone(draft.phone)} />
        <Text style={styles.label}>Tipo de profissional</Text><View style={styles.typeRow}>{(["CUIDADOR", "ENFERMEIRO"] as const).map((type) => <Pressable key={type} onPress={() => update("type", type)} style={[styles.type, draft.type === type && styles.selected]}><Text style={[styles.typeText, draft.type === type && styles.selectedText]}>{type === "CUIDADOR" ? "Cuidador" : "Enfermeiro"}</Text></Pressable>)}</View>
        <Text style={styles.label}>Especialidades</Text><View style={styles.chips}>{PROFESSIONAL_SPECIALTIES.map((specialty) => <Pressable key={specialty} onPress={() => toggleSpecialty(specialty)} style={[styles.chip, draft.specialties.includes(specialty) && styles.selected]}><Text style={[styles.chipText, draft.specialties.includes(specialty) && styles.selectedText]}>{specialty}</Text></Pressable>)}</View>{errors.specialties ? <Text style={styles.error}>{errors.specialties}</Text> : null}
        <Field error={errors.experience} label="Tempo de experiência" onChangeText={(value) => update("experience", value)} value={draft.experience} />
        <Field error={errors.education} label="Formação" onChangeText={(value) => update("education", value)} value={draft.education} />
        <Field label="Descrição profissional (opcional)" multiline onChangeText={(value) => update("description", value)} value={draft.description} />
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <Pressable disabled={saving} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? "Salvando..." : "Aplicar alterações"}</Text></Pressable>
    </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}

function Field({ error, label, multiline, ...props }: React.ComponentProps<typeof TextInput> & { error?: string; label: string }) {
    return <View><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor="#AAA2A5" style={[styles.input, multiline && styles.multiline, Boolean(error) && styles.inputError]} /><Text style={styles.error}>{error ?? ""}</Text></View>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" }, scroll: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 18, paddingBottom: 36 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, title: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 19 }, close: { color: "#713568", fontFamily: "Poppins-Medium", fontSize: 12 },
    label: { color: "#262326", fontFamily: "Poppins-Medium", fontSize: 11, marginTop: 12, marginBottom: 6 }, input: { minHeight: 48, color: "#262326", fontFamily: "Poppins-Regular", fontSize: 12, borderWidth: 1, borderColor: "#DDD5D2", borderRadius: 11, backgroundColor: "#FFFFFF", paddingHorizontal: 12 }, multiline: { minHeight: 100, paddingTop: 12, textAlignVertical: "top" }, inputError: { borderColor: "#A84F54" }, error: { minHeight: 14, color: "#A84F54", fontFamily: "Poppins-Regular", fontSize: 9, marginTop: 3 },
    typeRow: { flexDirection: "row", gap: 8 }, type: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#DDD5D2", borderRadius: 10, backgroundColor: "#FFFFFF" }, typeText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 11 }, selected: { borderColor: "#713568", backgroundColor: "#713568" }, selectedText: { color: "#FFFFFF" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, chip: { minHeight: 36, justifyContent: "center", borderWidth: 1, borderColor: "#DDD5D2", borderRadius: 18, backgroundColor: "#FFFFFF", paddingHorizontal: 12 }, chipText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9 }, save: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#713568", marginTop: 15 }, saveText: { color: "#FFFFFF", fontFamily: "Poppins-SemiBold", fontSize: 13 },
});
