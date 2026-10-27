import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

type PasswordVisibilityButtonProps = {
    visible: boolean;
    onPress: () => void;
};

export function PasswordVisibilityButton({
    visible,
    onPress,
}: PasswordVisibilityButtonProps) {
    const accessibilityLabel = visible ? "Ocultar senha" : "Mostrar senha";

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onPress}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
            <SymbolView
                name={visible
                    ? { ios: "eye.slash", android: "visibility_off", web: "visibility_off" }
                    : { ios: "eye", android: "visibility", web: "visibility" }}
                size={20}
                tintColor="#713568"
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        position: "absolute",
        top: 0,
        right: 8,
        bottom: 0,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        opacity: 0.55,
    },
});
