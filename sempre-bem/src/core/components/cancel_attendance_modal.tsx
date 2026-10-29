import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type CancelAttendanceModalProps = {
    error?: string;
    isCancelling: boolean;
    onClose: () => void;
    onConfirm: () => void;
    visible: boolean;
};

export function CancelAttendanceModal({
    error,
    isCancelling,
    onClose,
    onConfirm,
    visible,
}: CancelAttendanceModalProps) {
    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent
            visible={visible}
        >
            <View style={styles.overlay}>
                <Pressable
                    accessibilityLabel="Fechar confirmação de cancelamento"
                    disabled={isCancelling}
                    onPress={onClose}
                    style={StyleSheet.absoluteFill}
                />
                <View accessibilityViewIsModal style={styles.card}>
                    <View style={styles.iconContainer}>
                        <SymbolView
                            name={{ ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" }}
                            size={28}
                            tintColor="#B64E55"
                        />
                    </View>
                    <Text style={styles.title}>Cancelar atendimento?</Text>
                    <Text style={styles.description}>
                        O atendimento será encerrado e o pagamento ficará marcado como reembolsado.
                    </Text>
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>Essa ação não poderá ser desfeita.</Text>
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <View style={styles.actions}>
                        <Pressable
                            accessibilityRole="button"
                            disabled={isCancelling}
                            onPress={onClose}
                            style={({ pressed }) => [styles.keepButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.keepButtonText}>Manter atendimento</Text>
                        </Pressable>
                        <Pressable
                            accessibilityRole="button"
                            disabled={isCancelling}
                            onPress={onConfirm}
                            style={({ pressed }) => [
                                styles.cancelButton,
                                isCancelling && styles.disabled,
                                pressed && styles.pressed,
                            ]}
                        >
                            {isCancelling
                                ? <ActivityIndicator color="#FFFFFF" size="small" />
                                : <Text style={styles.cancelButtonText}>Sim, cancelar</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38, 35, 38, 0.62)", padding: 20 },
    card: { width: "100%", maxWidth: 390, alignItems: "center", borderRadius: 24, backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, elevation: 12, shadowColor: "#262326", shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.22, shadowRadius: 15 },
    iconContainer: { width: 58, height: 58, alignItems: "center", justifyContent: "center", borderRadius: 29, backgroundColor: "#FAECEC" },
    title: { color: "#262326", fontSize: 20, lineHeight: 27, fontWeight: "900", marginTop: 15, textAlign: "center" },
    description: { maxWidth: 315, color: "#766F73", fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: "center" },
    warningBox: { width: "100%", borderRadius: 12, backgroundColor: "#FAECEC", marginTop: 15, paddingHorizontal: 12, paddingVertical: 10 },
    warningText: { color: "#9E484D", fontSize: 10, lineHeight: 15, fontWeight: "700", textAlign: "center" },
    error: { color: "#B64E55", fontSize: 10, lineHeight: 15, fontWeight: "700", marginTop: 10, textAlign: "center" },
    actions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 20 },
    keepButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "#E5DED5", paddingHorizontal: 8 },
    keepButtonText: { color: "#262326", fontSize: 11, fontWeight: "800", textAlign: "center" },
    cancelButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#B64E55", paddingHorizontal: 8 },
    cancelButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
    disabled: { opacity: 0.65 },
    pressed: { opacity: 0.7 },
});
