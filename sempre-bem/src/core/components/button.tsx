import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    type TouchableOpacityProps,
} from "react-native";

const COLORS = {
    primary: "#713568",
    white: "#FFFFFF",
} as const;

export type ButtonProps = TouchableOpacityProps & {
    label: string;
    loading?: boolean;
};

export function Button({ label, loading = false, disabled, style, ...rest }: ButtonProps) {
    return (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            disabled={disabled || loading}
            style={[styles.container, (disabled || loading) && styles.disabled, style]}
            {...rest}
        >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.label}>{label}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        minHeight: 52,
        paddingHorizontal: 20,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
    },
    disabled: { opacity: 0.55 },
    label: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
