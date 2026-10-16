import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text } from "react-native";

const COLORS = {
    muted: "#82777E",
    plum: "#6D2D63",
} as const;

type BottomNavItemProps = {
    active?: boolean;
    icon: SymbolViewProps["name"];
    label: string;
    onPress?: () => void;
};

export function BottomNavItem({ active = false, icon, label, onPress }: BottomNavItemProps) {
    return (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
            <SymbolView name={icon} size={22} tintColor={active ? COLORS.plum : COLORS.muted} />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
    navLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "600" },
    navLabelActive: { color: COLORS.plum, fontWeight: "800" },
});
