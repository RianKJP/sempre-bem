import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type ViewStyle,
} from "react-native";

const COLORS = {
    border: "#DED5DA",
    error: "#EB5757",
    muted: "#82777E",
    placeholder: "#A49AA1",
    primary: "#713568",
    surface: "#FFFFFF",
    text: "#30272D",
} as const;

export type InputProps = TextInputProps & {
    label?: string;
    error?: string;
    helperText?: string;
    containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
    label,
    error,
    helperText,
    containerStyle,
    style,
    multiline,
    onBlur,
    onFocus,
    placeholderTextColor = COLORS.placeholder,
    ...rest
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <TextInput
                multiline={multiline}
                onBlur={(event) => {
                    setIsFocused(false);
                    onBlur?.(event);
                }}
                onFocus={(event) => {
                    setIsFocused(true);
                    onFocus?.(event);
                }}
                placeholderTextColor={placeholderTextColor}
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    style,
                ]}
                {...rest}
            />

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : helperText ? (
                <Text style={styles.helperText}>{helperText}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    label: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 8,
    },
    input: {
        width: "100%",
        minHeight: 54,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        color: COLORS.text,
        fontSize: 15,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    multiline: {
        minHeight: 112,
        paddingTop: 14,
        textAlignVertical: "top",
    },
    inputFocused: {
        borderColor: COLORS.primary,
        borderWidth: 1.5,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    helperText: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 6,
        marginLeft: 2,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 11,
        marginTop: 6,
        marginLeft: 2,
    },
});
