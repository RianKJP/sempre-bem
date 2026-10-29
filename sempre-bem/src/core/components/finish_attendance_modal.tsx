import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type FinishAttendanceModalProps = {
    error?: string;
    isFinishing: boolean;
    onClose: () => void;
    onConfirm: () => void;
    personName: string;
    visible: boolean;
};

export function FinishAttendanceModal({ error, isFinishing, onClose, onConfirm, personName, visible }: FinishAttendanceModalProps) {
    return <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
        <View style={styles.overlay}>
            <Pressable accessibilityLabel="Fechar confirmação" disabled={isFinishing} onPress={onClose} style={StyleSheet.absoluteFill} />
            <View accessibilityViewIsModal style={styles.card}>
                <View style={styles.icon}><SymbolView name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} size={31} tintColor="#738D2E" /></View>
                <Text style={styles.title}>Finalizar atendimento?</Text>
                <Text style={styles.description}>Confirme que o atendimento de {personName} foi concluído e que o profissional já pode ser liberado.</Text>
                <View style={styles.info}><Text style={styles.infoText}>O horário de término será registrado e o profissional ficará disponível para novos chamados.</Text></View>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.actions}>
                    <Pressable disabled={isFinishing} onPress={onClose} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><Text style={styles.backText}>Voltar</Text></Pressable>
                    <Pressable disabled={isFinishing} onPress={onConfirm} style={({ pressed }) => [styles.finishButton, isFinishing && styles.disabled, pressed && styles.pressed]}>{isFinishing ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.finishText}>Sim, finalizar</Text>}</Pressable>
                </View>
            </View>
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38, 35, 38, 0.62)", padding: 20 },
    card: { width: "100%", maxWidth: 390, alignItems: "center", borderRadius: 24, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, elevation: 12, shadowColor: "#262326", shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.22, shadowRadius: 15 },
    icon: { width: 60, height: 60, alignItems: "center", justifyContent: "center", borderRadius: 30, backgroundColor: "#F0F5E2" },
    title: { color: "#262326", fontSize: 20, lineHeight: 27, fontWeight: "900", marginTop: 15, textAlign: "center" },
    description: { maxWidth: 325, color: "#766F73", fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: "center" },
    info: { width: "100%", borderRadius: 12, backgroundColor: "#F0F5E2", marginTop: 15, paddingHorizontal: 12, paddingVertical: 10 },
    infoText: { color: "#607526", fontSize: 10, lineHeight: 15, fontWeight: "700", textAlign: "center" },
    error: { color: "#B64E55", fontSize: 10, lineHeight: 15, fontWeight: "700", marginTop: 10, textAlign: "center" },
    actions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 20 },
    backButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "#E5DED5", paddingHorizontal: 8 },
    backText: { color: "#262326", fontSize: 11, fontWeight: "800" },
    finishButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#738D2E", paddingHorizontal: 8 },
    finishText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.65 }, pressed: { opacity: 0.7 },
});
