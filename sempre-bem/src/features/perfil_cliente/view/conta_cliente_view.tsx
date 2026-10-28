import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CLIENT_API_ENDPOINTS } from "@/features/app_cliente/config/api_config";
import { clearAuthenticatedAccount } from "@/features/autenticacao/service/auth_session_repository";
import { EditProfileModal } from "@/features/perfil_cliente/components/edit_profile_modal";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";
import { useClienteProfile } from "@/features/perfil_cliente/state/profile";

type CardProps = {
    danger?: boolean;
    description: string;
    onPress: () => void;
    title: string;
};

function ActionCard({ danger = false, description, onPress, title }: CardProps) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, danger && styles.dangerCard, pressed && styles.pressed]}>
            <View style={styles.cardCopy}>
                <Text style={[styles.cardTitle, danger && styles.dangerText]}>{title}</Text>
                <Text style={styles.cardDescription}>{description}</Text>
            </View>
            <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={20} tintColor={danger ? "#A84F54" : "#8794AA"} />
        </Pressable>
    );
}

export default function ContaClienteView() {
    const router = useRouter();
    const params = useLocalSearchParams<{ familiaId?: string | string[] }>();
    const familiaId = Array.isArray(params.familiaId) ? params.familiaId[0] : params.familiaId ?? "1";
    const loaded = useClienteFonts();
    const { error, loading, profile, reload, updateProfile } = useClienteProfile(familiaId);
    const [editing, setEditing] = useState(false);
    const deleting = useRef(false);

    if (!loaded) return <View style={styles.screen} />;
    if (loading) return <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando conta...</Text></View>;
    if (error || !profile) return <View style={styles.state}><Text style={styles.stateText}>{error ?? "Conta não encontrada."}</Text><Pressable onPress={reload}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>;

    function signOut() {
        Alert.alert(
            "Sair da conta",
            "Você voltará à escolha de perfil. O acesso continuará salvo neste aparelho.",
            [{ text: "Cancelar", style: "cancel" }, { text: "Sair", onPress: () => router.replace("/") }],
        );
    }

    function removeAccount() {
        if (deleting.current) return;
        Alert.alert(
            "Excluir conta",
            "Esta ação remove a família da API e não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir conta",
                    style: "destructive",
                    onPress: async () => {
                        if (deleting.current) return;
                        deleting.current = true;
                        try {
                            const response = await fetch(CLIENT_API_ENDPOINTS.familia(familiaId), { method: "DELETE" });
                            if (!response.ok) throw new Error("Não foi possível excluir a conta.");
                            await clearAuthenticatedAccount("cliente");
                            router.replace("/");
                        } catch (failure) {
                            Alert.alert("Falha ao excluir", failure instanceof Error ? failure.message : "Tente novamente.");
                        } finally {
                            deleting.current = false;
                        }
                    },
                },
            ],
        );
    }

    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}>
                        <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={23} tintColor="#262326" />
                    </Pressable>
                    <View>
                        <Text style={styles.title}>Conta</Text>
                        <Text style={styles.subtitle}>Segurança, acesso e privacidade</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Acesso</Text>
                <ActionCard title="Dados pessoais" description={`${profile.name} · ${profile.email}`} onPress={() => setEditing(true)} />
                <ActionCard title="Alterar senha" description="Atualização de senha ainda não disponível" onPress={() => Alert.alert("Alterar senha", "A troca de senha será integrada em uma próxima etapa.")} />

                <Text style={styles.sectionTitle}>Privacidade</Text>
                <ActionCard title="Privacidade e dados" description="Dados salvos na API acadêmica e sessão neste aparelho" onPress={() => Alert.alert("Privacidade e dados", "Nome, e-mail e telefone são armazenados na API do projeto. A sessão de acesso fica no SQLite deste aparelho.")} />
                <ActionCard title="Termos de uso" description="Consultar informações do projeto" onPress={() => Alert.alert("Termos de uso", "O documento completo de termos ainda não foi adicionado ao projeto acadêmico.")} />

                <Text style={styles.sectionTitle}>Sessão</Text>
                <ActionCard title="Sair da conta" description="Voltar à escolha entre cliente e prestador" onPress={signOut} />
                <ActionCard danger title="Excluir conta" description="Remover permanentemente este cadastro" onPress={removeAccount} />
            </ScrollView>
            {editing ? <EditProfileModal initialValue={profile} onClose={() => setEditing(false)} onSave={async (value) => { try { await updateProfile(value); setEditing(false); } catch (failure) { Alert.alert("Não foi possível atualizar", failure instanceof Error ? failure.message : "Tente novamente."); } }} /> : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" },
    scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 28, width: "100%", maxWidth: 680, alignSelf: "center" },
    header: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
    title: { fontFamily: "Poppins-SemiBold", fontSize: 20, lineHeight: 27, color: "#262326" },
    subtitle: { fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#81767B" },
    sectionTitle: { marginTop: 24, marginBottom: 10, fontFamily: "Poppins-SemiBold", fontSize: 15, color: "#262326" },
    card: { minHeight: 72, marginBottom: 9, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF" },
    dangerCard: { backgroundColor: "#F9EEEE", borderColor: "#EBCFD1" },
    cardCopy: { flex: 1 },
    cardTitle: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#262326" },
    cardDescription: { marginTop: 4, fontFamily: "Poppins-Regular", fontSize: 10, lineHeight: 15, color: "#81767B" },
    dangerText: { color: "#A84F54" },
    state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#F8F5ED" },
    stateText: { fontFamily: "Poppins-Regular", fontSize: 13, color: "#81767B", textAlign: "center" },
    retry: { fontFamily: "Poppins-SemiBold", fontSize: 13, color: "#713568" },
    pressed: { opacity: 0.65 },
});
