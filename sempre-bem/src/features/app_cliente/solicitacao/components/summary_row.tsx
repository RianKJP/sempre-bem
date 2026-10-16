import { StyleSheet, Text, View } from "react-native";

type SummaryRowProps = {
    label: string;
    last?: boolean;
    value: string;
};

export function SummaryRow({ label, value, last = false }: SummaryRowProps) {
    return (
        <View style={[styles.row, last && styles.lastRow]}>
            <Text style={styles.label}>{label.toUpperCase()}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { borderBottomWidth: 1, borderBottomColor: "#E5DED5", paddingVertical: 14 },
    lastRow: { borderBottomWidth: 0 },
    label: { color: "#766F73", fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
    value: { color: "#262326", fontSize: 14, fontWeight: "600", lineHeight: 20, marginTop: 4 },
});
