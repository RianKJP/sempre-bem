import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HomeProfessional } from "@/features/app_cliente/home/viewmodels/use_home_view_model";

const COLORS = {
    border: "#E5DED5",
    primary: "#713568",
    secondary: "#94AA32",
    surface: "#FFFFFF",
    text: "#262326",
    textMuted: "#766F73",
    white: "#FFFFFF",
} as const;

type ProfessionalCardProps = {
    professional: HomeProfessional;
};

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
    return (
        <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: professional.color }]}>
                <Text style={styles.initials}>{professional.initials}</Text>
                <View style={styles.onlineDot} />
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{professional.name}</Text>
                <Text style={styles.role}>{professional.role}</Text>
                <View style={styles.metaRow}>
                    <SymbolView
                        name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                        size={13}
                        tintColor={COLORS.secondary}
                    />
                    <Text style={styles.metaStrong}>{professional.status}</Text>
                </View>
            </View>
            <Pressable accessibilityRole="button" style={styles.profileButton}>
                <Text style={styles.profileButtonText}>Ver perfil</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 13, marginBottom: 10 },
    avatar: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    initials: { color: COLORS.text, fontSize: 15, fontWeight: "800" },
    onlineDot: { position: "absolute", width: 12, height: 12, borderRadius: 6, right: -3, bottom: -2, backgroundColor: COLORS.secondary, borderWidth: 2, borderColor: COLORS.surface },
    info: { flex: 1, marginLeft: 13 },
    name: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
    role: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    metaRow: { flexDirection: "row", alignItems: "center", marginTop: 7 },
    metaStrong: { color: COLORS.secondary, fontSize: 11, fontWeight: "700", marginLeft: 4 },
    profileButton: { backgroundColor: COLORS.primary, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 },
    profileButtonText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
});
