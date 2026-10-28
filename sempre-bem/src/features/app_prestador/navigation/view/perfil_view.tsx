import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PerfilPrestadorView() {
    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <View style={styles.content}>
                <Text accessibilityRole="header" style={styles.title}>Perfil profissional</Text>
                <Text style={styles.subtitle}>Gerencie seus dados e informações profissionais.</Text>

                <View style={styles.card}>
                    <View style={styles.avatar}>
                        <SymbolView
                            name={{ ios: "person", android: "person_outline", web: "person_outline" }}
                            size={34}
                            tintColor="#743268"
                        />
                    </View>
                    <Text style={styles.cardTitle}>Perfil do prestador</Text>
                    <Text style={styles.cardDescription}>
                        A edição dos dados profissionais será implementada aqui como um CRUD.
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
    card: { alignItems: "center", minHeight: 220, marginTop: 24, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: "#E7DFD8", backgroundColor: "#FFFFFF" },
    avatar: { width: 72, height: 72, alignItems: "center", justifyContent: "center", borderRadius: 36, backgroundColor: "#F5EDF4" },
    cardTitle: { color: "#2E292C", fontSize: 16, fontWeight: "800", marginTop: 16 },
    cardDescription: { maxWidth: 310, color: "#7D7478", fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: "center" },
});
