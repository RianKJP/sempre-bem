import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AtendimentosPrestadorView() {
    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <View style={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Atendimento</Text>
                <Text style={styles.subtitle}>Acompanhe seus cuidados agendados e em andamento.</Text>

                <View style={styles.emptyCard}>
                    <View style={styles.iconContainer}>
                        <SymbolView
                            name={{ ios: "heart", android: "favorite_border", web: "favorite_border" }}
                            size={30}
                            tintColor="#743268"
                        />
                    </View>
                    <Text style={styles.emptyTitle}>Nenhum atendimento selecionado</Text>
                    <Text style={styles.emptyDescription}>
                        Os próximos atendimentos do profissional serão organizados nesta página.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#FAF7F0" },
    content: { flex: 1, width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 16, paddingTop: 22 },
    title: { color: "#2E292C", fontSize: 22, lineHeight: 29, fontWeight: "800" },
    subtitle: { color: "#7D7478", fontSize: 13, lineHeight: 19, marginTop: 4 },
    emptyCard: { alignItems: "center", justifyContent: "center", minHeight: 220, marginTop: 24, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: "#E7DFD8", backgroundColor: "#FFFFFF" },
    iconContainer: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 31, backgroundColor: "#F5EDF4" },
    emptyTitle: { color: "#2E292C", fontSize: 16, fontWeight: "800", marginTop: 16, textAlign: "center" },
    emptyDescription: { maxWidth: 310, color: "#7D7478", fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: "center" },
});
