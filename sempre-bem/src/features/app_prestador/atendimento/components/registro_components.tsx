import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export const RECORD_COLORS = { background: "#F7F4EC", border: "#E6E0D4", danger: "#A32D2D", muted: "#8A8580", primary: "#743268", primarySoft: "#F1E8F0", surface: "#FFFEF8", text: "#1E1A1D" } as const;

export function RegistroHeader({ person, title }: { person: string; title: string }) {
    const router = useRouter();
    return <View style={styles.header}><Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.back}><SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={21} tintColor={RECORD_COLORS.text} /></Pressable><View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.person}>{person}</Text></View></View>;
}

export const recordStyles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: RECORD_COLORS.background },
    content: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 16, paddingBottom: 36 },
    card: { borderRadius: 17, borderWidth: 1, borderColor: RECORD_COLORS.border, backgroundColor: RECORD_COLORS.surface, padding: 15, marginTop: 8 },
    label: { color: RECORD_COLORS.text, fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 6 },
    input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: RECORD_COLORS.border, backgroundColor: "#FFFFFF", color: RECORD_COLORS.text, fontSize: 13, paddingHorizontal: 13, paddingVertical: 10 },
    area: { minHeight: 92, textAlignVertical: "top" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    chip: { minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 1, borderColor: RECORD_COLORS.border, backgroundColor: "#FFFFFF", paddingHorizontal: 12 },
    chipActive: { borderColor: RECORD_COLORS.primary, backgroundColor: RECORD_COLORS.primary },
    chipText: { color: RECORD_COLORS.muted, fontSize: 10, fontWeight: "700" },
    chipTextActive: { color: "#FFFFFF" },
    primary: { minHeight: 49, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: RECORD_COLORS.primary, marginTop: 18 },
    primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
    secondary: { minHeight: 42, alignItems: "center", justifyContent: "center", marginTop: 5 },
    secondaryText: { color: RECORD_COLORS.danger, fontSize: 11, fontWeight: "800" },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 9 },
    sectionTitle: { color: RECORD_COLORS.text, fontSize: 15, fontWeight: "900" },
    count: { color: RECORD_COLORS.muted, fontSize: 9 },
    item: { borderRadius: 14, borderWidth: 1, borderColor: RECORD_COLORS.border, borderLeftWidth: 4, borderLeftColor: RECORD_COLORS.primary, backgroundColor: RECORD_COLORS.surface, marginBottom: 8, padding: 12 },
    itemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    itemTitle: { flex: 1, color: RECORD_COLORS.text, fontSize: 12, fontWeight: "900" },
    itemDate: { color: RECORD_COLORS.muted, fontSize: 8 },
    itemText: { color: RECORD_COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
    itemActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: RECORD_COLORS.border, marginTop: 9, paddingTop: 8 },
    textButton: { paddingHorizontal: 8, paddingVertical: 5 },
    editText: { color: RECORD_COLORS.primary, fontSize: 10, fontWeight: "800" },
    deleteText: { color: RECORD_COLORS.danger, fontSize: 10, fontWeight: "800" },
    empty: { color: RECORD_COLORS.muted, fontSize: 11, textAlign: "center", paddingVertical: 20 },
    error: { color: RECORD_COLORS.danger, fontSize: 10, lineHeight: 14, marginTop: 7 },
    pressed: { opacity: 0.68 },
});

const styles = StyleSheet.create({
    header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
    back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: RECORD_COLORS.border, backgroundColor: RECORD_COLORS.surface },
    copy: { flex: 1 }, title: { color: RECORD_COLORS.text, fontSize: 19, fontWeight: "900" }, person: { color: RECORD_COLORS.muted, fontSize: 11, marginTop: 2 },
});
