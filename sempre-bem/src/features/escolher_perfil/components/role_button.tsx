import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
    greenDark: "#657522",
    greenLight: "#EDF1DD",
    greenSurface: "#FBFCF6",
    greenBorder: "#D9E0BA",
    muted: "#82777E",
    plum: "#6D2D63",
    plumLight: "#F2E7F0",
    plumBorder: "#DECED9",
    surface: "#FFFFFF",
    text: "#30272D",
} as const;

type RoleButtonProps = {
    description: string;
    icon: {
        ios: "heart.fill" | "person.2.fill";
        android: "favorite" | "group";
        web: "favorite" | "group";
    };
    label: string;
    onPress: () => void;
    tone: "plum" | "green";
};

export function RoleButton({ description, icon, label, onPress, tone }: RoleButtonProps) {
    const isPlum = tone === "plum";

    return (
        <Pressable
            accessibilityHint={description}
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => [
                styles.roleButton,
                isPlum ? styles.roleButtonPlum : styles.roleButtonGreen,
                pressed && styles.pressed,
            ]}
        >
            <View style={[styles.iconBox, isPlum ? styles.iconBoxPlum : styles.iconBoxGreen]}>
                <SymbolView
                    name={icon}
                    size={28}
                    tintColor={isPlum ? COLORS.plum : COLORS.greenDark}
                />
            </View>
            <View style={styles.roleContent}>
                <Text style={styles.roleLabel}>{label}</Text>
                <Text style={styles.roleDescription}>{description}</Text>
            </View>
            <SymbolView
                name={{ ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" }}
                size={23}
                tintColor={isPlum ? COLORS.plum : COLORS.greenDark}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    roleButton: {
        minHeight: 126,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 24,
        borderWidth: 1,
        padding: 17,
    },
    roleButtonPlum: { backgroundColor: COLORS.surface, borderColor: COLORS.plumBorder },
    roleButtonGreen: {
        backgroundColor: COLORS.greenSurface,
        borderColor: COLORS.greenBorder,
    },
    pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    iconBoxPlum: { backgroundColor: COLORS.plumLight },
    iconBoxGreen: { backgroundColor: COLORS.greenLight },
    roleContent: { flex: 1, marginHorizontal: 15 },
    roleLabel: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
    roleDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
