import { useState } from "react";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

function formatInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 7);
    return digits ? (Number(digits) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

function initialValue(value: number | null) {
    return value ? formatInput(String(Math.round(value * 100))) : "";
}

export function HourlyRateModal({ currentValue, onClose, onSave }: { currentValue: number | null; onClose: () => void; onSave: (value: number) => Promise<unknown> }) {
    const [value, setValue] = useState(initialValue(currentValue));
    const [error, setError] = useState<string>();
    const [saving, setSaving] = useState(false);

    async function save() {
        const parsed = Number(value.replace(/\./g, "").replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 99_999.99) {
            setError("Informe um valor entre R$ 1,00 e R$ 99.999,99.");
            return;
        }
        setSaving(true);
        setError(undefined);
        try { await onSave(parsed); onClose(); }
        catch (failure) { setError(failure instanceof Error ? failure.message : "Não foi possível salvar."); }
        finally { setSaving(false); }
    }

    return <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
            <Pressable disabled={saving} onPress={onClose} style={StyleSheet.absoluteFill} />
            <View accessibilityViewIsModal style={styles.card}>
                <View style={styles.icon}><SymbolView name={{ ios: "banknote", android: "payments", web: "payments" }} size={27} tintColor="#713568" /></View>
                <Text style={styles.title}>Valor da sua hora</Text>
                <Text style={styles.description}>Esse valor será exibido aos clientes quando você estiver online.</Text>
                <Text style={styles.label}>Valor por hora</Text>
                <View style={[styles.inputContainer, Boolean(error) && styles.invalid]}><Text style={styles.prefix}>R$</Text><TextInput accessibilityLabel="Valor por hora" autoFocus editable={!saving} keyboardType="numeric" onChangeText={(text) => { setValue(formatInput(text)); setError(undefined); }} placeholder="0,00" placeholderTextColor="#AAA2A5" style={styles.input} value={value} /></View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.actions}><Pressable disabled={saving} onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable disabled={saving} onPress={() => void save()} style={styles.save}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Salvar valor</Text>}</Pressable></View>
            </View>
        </KeyboardAvoidingView>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(46,41,44,0.58)", padding: 20 },
    card: { width: "100%", maxWidth: 390, borderRadius: 22, backgroundColor: "#FFFFFF", padding: 22 },
    icon: { width: 56, height: 56, alignItems: "center", justifyContent: "center", alignSelf: "center", borderRadius: 28, backgroundColor: "#F5EDF4" },
    title: { color: "#2E292C", fontFamily: "Poppins-SemiBold", fontSize: 20, marginTop: 14, textAlign: "center" },
    description: { color: "#7D7478", fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, marginTop: 5, textAlign: "center" },
    label: { color: "#2E292C", fontFamily: "Poppins-Medium", fontSize: 12, marginTop: 22, marginBottom: 8 },
    inputContainer: { minHeight: 54, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: "#E7DFD8", backgroundColor: "#FAF7F0", paddingHorizontal: 14 },
    invalid: { borderColor: "#B85E61" }, prefix: { color: "#2E292C", fontFamily: "Poppins-SemiBold", fontSize: 16, marginRight: 8 },
    input: { flex: 1, color: "#2E292C", fontFamily: "Poppins-SemiBold", fontSize: 20, paddingVertical: 10 },
    error: { color: "#B85E61", fontFamily: "Poppins-Regular", fontSize: 10, marginTop: 7 },
    actions: { flexDirection: "row", gap: 10, marginTop: 22 }, cancel: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "#E7DFD8" },
    cancelText: { color: "#2E292C", fontFamily: "Poppins-Medium", fontSize: 12 }, save: { flex: 1.25, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#713568" }, saveText: { color: "#FFFFFF", fontFamily: "Poppins-SemiBold", fontSize: 12 },
});
