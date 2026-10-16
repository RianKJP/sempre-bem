import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RoleButton } from "@/features/escolher_perfil/components/role_button";
import { PROFILE_OPTIONS } from "@/features/escolher_perfil/service/profile_service";
import { useEscolherPerfilViewModel } from "@/features/escolher_perfil/viewmodels/use_escolher_perfil_view_model";

const COLORS = {
    background: "#F7F3EA",
    green: "#91A83D",
    greenLight: "#EDF1DD",
    muted: "#82777E",
    plum: "#6D2D63",
    plumLight: "#F2E7F0",
    text: "#30272D",
} as const;

export default function EscolherPerfilView() {
    const { openCliente, openCuidador } = useEscolherPerfilViewModel();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.decorationLarge} />
            <View style={styles.decorationSmall} />
            <View style={styles.content}>
                <View style={styles.brand}>
                    <Image
                        accessibilityIgnoresInvertColors
                        source={require("@/assets/logos/logo_sempre_bem.png")}
                        style={styles.logo}
                    />
                    <Text style={styles.brandName}>SEMPRE BEM</Text>
                </View>

                <View style={styles.intro}>
                    <Text style={styles.eyebrow}>BEM-VINDO</Text>
                    <Text style={styles.title}>Como você quer entrar?</Text>
                    <Text style={styles.subtitle}>
                        Escolha seu perfil para acessar uma experiência feita para você.
                    </Text>
                </View>

                <View style={styles.options}>
                    <RoleButton
                        description={PROFILE_OPTIONS.cliente.description}
                        icon={{ ios: "person.2.fill", android: "group", web: "group" }}
                        label={PROFILE_OPTIONS.cliente.label}
                        onPress={openCliente}
                        tone="green"
                    />
                    <RoleButton
                        description={PROFILE_OPTIONS.cuidador.description}
                        icon={{ ios: "heart.fill", android: "favorite", web: "favorite" }}
                        label={PROFILE_OPTIONS.cuidador.label}
                        onPress={openCuidador}
                        tone="plum"
                    />
                </View>

                <Text style={styles.footerText}>
                    Você poderá alterar seu perfil depois nas configurações.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background, overflow: "hidden" },
    decorationLarge: {
        position: "absolute",
        width: 290,
        height: 290,
        borderRadius: 145,
        backgroundColor: COLORS.plumLight,
        right: -145,
        top: -90,
    },
    decorationSmall: {
        position: "absolute",
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.greenLight,
        left: -70,
        bottom: 45,
    },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 24 },
    brand: { flexDirection: "row", alignItems: "center", gap: 11 },
    logo: { width: 46, height: 46, borderRadius: 14 },
    brandName: { color: COLORS.plum, fontSize: 13, fontWeight: "900", letterSpacing: 1.8 },
    intro: { marginTop: "auto", marginBottom: 34 },
    eyebrow: { color: COLORS.green, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
    title: {
        color: COLORS.text,
        fontSize: 34,
        lineHeight: 41,
        fontWeight: "900",
        marginTop: 9,
        maxWidth: 330,
    },
    subtitle: {
        color: COLORS.muted,
        fontSize: 16,
        lineHeight: 24,
        marginTop: 12,
        maxWidth: 340,
    },
    options: { gap: 14 },
    footerText: {
        color: COLORS.muted,
        fontSize: 11,
        lineHeight: 17,
        textAlign: "center",
        marginTop: 22,
        marginBottom: "auto",
    },
});
