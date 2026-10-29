import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PROVIDER_API_ENDPOINTS } from "@/features/app_prestador/config/api_config";
import { clearAuthenticatedAccount } from "@/features/autenticacao/service/auth_session_repository";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";
import { EditProviderProfileModal } from "@/features/perfil_prestador/components/edit_provider_profile_modal";
import { useProviderProfile } from "@/features/perfil_prestador/state/profile";

function ActionCard({ danger = false, description, icon, onPress, title }: { danger?: boolean; description: string; icon?: "logout" | "delete"; onPress: () => void; title: string }) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, danger && styles.dangerCard, pressed && styles.pressed]}>
        {icon ? <SymbolView name={icon === "delete" ? { ios: "trash", android: "delete_outline", web: "delete_outline" } : { ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }} size={18} tintColor={danger ? "#A84F54" : "#713568"} /> : null}
        <View style={styles.cardCopy}><Text style={[styles.cardTitle, danger && styles.dangerText]}>{title}</Text><Text style={styles.cardDescription}>{description}</Text></View>
        {!icon ? <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={19} tintColor="#262326" /> : null}
    </Pressable>;
}

export default function ContaPrestadorView() {
    const router = useRouter();
    const params = useLocalSearchParams<{ prestadorId?: string | string[] }>();
    const providerId = Array.isArray(params.prestadorId) ? params.prestadorId[0] : params.prestadorId ?? "1";
    const fontsLoaded = useClienteFonts();
    const { error, loading, profile, reload, updateProfile } = useProviderProfile(providerId);
    const [editing, setEditing] = useState(false);
    const deleting = useRef(false);

    if (!fontsLoaded) return <View style={styles.screen} />;
    if (loading) return <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando conta...</Text></View>;
    if (error || !profile) return <View style={styles.state}><Text style={styles.stateText}>{error ?? "Conta não encontrada."}</Text><Pressable onPress={reload}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>;

    function signOut() {
        Alert.alert("Sair da conta", "Você voltará à escolha de perfil. O acesso continuará salvo neste aparelho.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", onPress: () => router.replace("/") },
        ]);
    }

    function removeAccount() {
        if (deleting.current) return;
        Alert.alert("Excluir conta", "Esta ação remove o perfil profissional e não pode ser desfeita.", [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir conta", style: "destructive", onPress: async () => {
                if (deleting.current) return;
                deleting.current = true;
                try {
                    const response = await fetch(PROVIDER_API_ENDPOINTS.prestador(providerId), { method: "DELETE" });
                    if (!response.ok) throw new Error("Não foi possível excluir a conta.");
                    await clearAuthenticatedAccount("profissional");
                    router.replace("/");
                } catch (failure) { Alert.alert("Falha ao excluir", failure instanceof Error ? failure.message : "Tente novamente."); }
                finally { deleting.current = false; }
            } },
        ]);
    }

    return <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}><Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}><SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={21} tintColor="#262326" /></Pressable><View><Text style={styles.title}>Conta</Text><Text style={styles.subtitle}>Segurança e acesso</Text></View></View>
            <Text style={styles.sectionTitle}>Acesso</Text>
            <ActionCard title="E-mail" description={profile.email} onPress={() => setEditing(true)} />
            <ActionCard title="Alterar senha" description="Atualização de senha ainda não disponível" onPress={() => Alert.alert("Alterar senha", "A troca de senha será integrada em uma próxima etapa.")} />
            <Text style={styles.sectionTitle}>Privacidade</Text>
            <ActionCard title="Privacidade e dados" description="Gerencie seus dados pessoais" onPress={() => Alert.alert("Privacidade e dados", "Seus dados profissionais ficam na API acadêmica e sua sessão fica no SQLite deste aparelho.")} />
            <ActionCard title="Termos de uso" description="Versão atual do documento" onPress={() => Alert.alert("Termos de uso", "O documento completo ainda será adicionado ao projeto acadêmico.")} />
            <Text style={styles.sectionTitle}>Sessão</Text>
            <ActionCard icon="logout" title="Sair da conta" description="Você precisará entrar novamente" onPress={signOut} />
            <ActionCard danger icon="delete" title="Excluir conta" description="Remover permanentemente seus dados" onPress={removeAccount} />
        </ScrollView>
        {editing ? <EditProviderProfileModal initialValue={profile} onClose={() => setEditing(false)} onSave={updateProfile} /> : null}
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" }, scroll: { flexGrow: 1, width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 12, paddingTop: 20, paddingBottom: 30 },
    header: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 11 }, backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF" }, title: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 17 }, subtitle: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9, marginTop: 1 },
    sectionTitle: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 13, marginTop: 22, marginBottom: 9 }, card: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", marginBottom: 8, paddingHorizontal: 12, paddingVertical: 11 }, dangerCard: { borderColor: "#EBCFD1", backgroundColor: "#F9EEEE" }, cardCopy: { flex: 1 }, cardTitle: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 11 }, cardDescription: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 8, marginTop: 4 }, dangerText: { color: "#A84F54" }, pressed: { opacity: 0.65 },
    state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#F8F5ED" }, stateText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 12, textAlign: "center" }, retry: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 12 },
});
