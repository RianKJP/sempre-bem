import type { PropsWithChildren } from "react";
import { StyleSheet, Text, type ColorValue } from "react-native";

type ResponsiveTabLabelProps = PropsWithChildren<{
    color: ColorValue;
}>;

export function ResponsiveTabLabel({ children, color }: ResponsiveTabLabelProps) {
    return (
        <Text
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={[styles.label, { color }]}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    label: {
        fontFamily: "Poppins-Regular",
        fontSize: 12,
        includeFontPadding: false,
        lineHeight: 16,
        paddingHorizontal: 1,
        textAlign: "center",
        width: "100%",
    },
});
