import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

const COLORS = {
    border: "#E7DEE2",
    muted: "#82777E",
    plum: "#6D2D63",
    surface: "#FFFFFF",
    text: "#30272D",
} as const;

type MetricCardProps = {
    icon: SymbolViewProps["name"];
    label: string;
    value: string;
};

export function MetricCard({ value, label, icon }: MetricCardProps) {
    return (
        <View style={styles.card}>
            <SymbolView name={icon} size={21} tintColor={COLORS.plum} />
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { flex: 1, minHeight: 112, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, alignItems: "center", justifyContent: "center", padding: 10 },
    value: { color: COLORS.text, fontSize: 18, fontWeight: "900", marginTop: 7 },
    label: { color: COLORS.muted, fontSize: 10, marginTop: 3, textAlign: "center" },
});
