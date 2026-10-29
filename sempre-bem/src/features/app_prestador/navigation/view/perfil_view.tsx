import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getNameInitials } from "@/core/utils/name_initials";
import { ProfileMenuCard } from "@/features/perfil_cliente/components/profile_menu_card";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";
import { EditProviderProfileModal } from "@/features/perfil_prestador/components/edit_provider_profile_modal";
import { HourlyRateModal } from "@/features/perfil_prestador/components/hourly_rate_modal";
import { useProviderProfile } from "@/features/perfil_prestador/state/profile";

export default function PerfilPrestadorView() {
    const router = useRouter();
    const params = useLocalSearchParams<{ prestadorId?: string | string[] }>();
    const providerId = Array.isArray(params.prestadorId) ? params.prestadorId[0] : params.prestadorId ?? "1";
    const fontsLoaded = useClienteFonts();
    const { error, loading, profile, reload, updateHourlyRate, updateProfile } = useProviderProfile(providerId);
    const [editing, setEditing] = useState(false);
    const [editingRate, setEditingRate] = useState(false);

    if (!fontsLoaded) return <View style={styles.screen} />;
    if (loading) return <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando perfil...</Text></View>;
    if (error || !profile) return <View style={styles.state}><Text style={styles.stateText}>{error ?? "Perfil não encontrado."}</Text><Pressable onPress={reload}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>;
    const role = profile.type === "ENFERMEIRO" ? "Enfermeiro" : "Cuidador";
    const hourlyRate = profile.hourlyRate ? new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(profile.hourlyRate) : "Não definido";

    return <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}><View><Text style={styles.title}>Perfil</Text><Text style={styles.subtitle}>Seus dados pessoais e profissionais</Text></View><View style={styles.headerIcon}><SymbolView name={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }} size={25} tintColor="#713568" /></View></View>
            <View style={styles.identity}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getNameInitials(profile.name)}</Text></View>
                <View style={styles.identityCopy}><Text style={styles.name}>{profile.name}</Text><Text style={styles.email}>{profile.email}</Text><View style={styles.rolePill}><Text style={styles.roleText}>{role}</Text></View></View>
            </View>

            <View style={styles.rateCard}>
                <View style={styles.rateIcon}><SymbolView name={{ ios: "banknote", android: "payments", web: "payments" }} size={24} tintColor="#713568" /></View>
                <View style={styles.rateCopy}><Text style={styles.rateLabel}>VALOR DA HORA</Text><Text style={styles.rateValue}>{hourlyRate}</Text><Text style={styles.rateHint}>Exibido aos clientes quando você estiver online</Text></View>
                <Pressable accessibilityLabel="Editar valor da hora" onPress={() => setEditingRate(true)} style={styles.editRate}><SymbolView name={{ ios: "pencil", android: "edit", web: "edit" }} size={17} tintColor="#713568" /></Pressable>
            </View>

            <View style={styles.menu}>
                <ProfileMenuCard title="Dados pessoais e profissionais" description="Editar perfil, formação e especialidades" onPress={() => setEditing(true)} />
                <ProfileMenuCard title="Atendimentos" description="Acessar a central do atendimento atual" onPress={() => router.push({ pathname: "/atendimento-prestador", params: { prestadorId: providerId } })} />
                <ProfileMenuCard title="Configurações da conta" description="Acesso, privacidade e sessão" onPress={() => router.push({ pathname: "/conta-prestador", params: { prestadorId: providerId } } as never)} />
            </View>

            <View style={styles.professionalCard}><Text style={styles.professionalTitle}>Sobre o profissional</Text><Text style={styles.professionalDescription}>{profile.description || "Nenhuma descrição profissional cadastrada."}</Text><View style={styles.detailRow}><Text style={styles.detailLabel}>Formação</Text><Text style={styles.detailValue}>{profile.education || "Não informada"}</Text></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Experiência</Text><Text style={styles.detailValue}>{profile.experience || "Não informada"}</Text></View><View style={styles.chips}>{profile.specialties.map((item) => <View key={item} style={styles.chip}><Text style={styles.chipText}>{item}</Text></View>)}</View></View>
        </ScrollView>
        {editing ? <EditProviderProfileModal initialValue={profile} onClose={() => setEditing(false)} onSave={updateProfile} /> : null}
        {editingRate ? <HourlyRateModal currentValue={profile.hourlyRate} onClose={() => setEditingRate(false)} onSave={updateHourlyRate} /> : null}
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" }, scroll: { width: "100%", maxWidth: 680, alignSelf: "center", padding: 16, paddingTop: 20, paddingBottom: 34 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 22 }, subtitle: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 10, marginTop: 2 }, headerIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#F2E8F0" },
    identity: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, borderColor: "#E5DED5", backgroundColor: "#FFFFFF", marginTop: 18, padding: 16 }, avatar: { width: 66, height: 66, alignItems: "center", justifyContent: "center", borderRadius: 33, backgroundColor: "#713568" }, avatarText: { color: "#FFFFFF", fontFamily: "Poppins-SemiBold", fontSize: 20 }, identityCopy: { flex: 1, marginLeft: 13 }, name: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 17 }, email: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 10, marginTop: 2 }, rolePill: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#EFF4DD", marginTop: 7, paddingHorizontal: 8, paddingVertical: 4 }, roleText: { color: "#718521", fontFamily: "Poppins-SemiBold", fontSize: 8 },
    rateCard: { minHeight: 92, flexDirection: "row", alignItems: "center", borderRadius: 17, borderWidth: 1, borderColor: "#D8BFD3", backgroundColor: "#F7EDF5", marginTop: 12, padding: 14 }, rateIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF" }, rateCopy: { flex: 1, marginLeft: 11 }, rateLabel: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 8, letterSpacing: 0.6 }, rateValue: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 18, marginTop: 2 }, rateHint: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 8, marginTop: 2 }, editRate: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "#FFFFFF" },
    menu: { gap: 9, marginTop: 17 }, professionalCard: { borderRadius: 17, borderWidth: 1, borderColor: "#E5DED5", backgroundColor: "#FFFFFF", marginTop: 16, padding: 15 }, professionalTitle: { color: "#262326", fontFamily: "Poppins-SemiBold", fontSize: 14 }, professionalDescription: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 10, lineHeight: 16, marginTop: 6 }, detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: "#EEE8E2", marginTop: 10, paddingTop: 10 }, detailLabel: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 9 }, detailValue: { flex: 1, color: "#262326", fontFamily: "Poppins-Medium", fontSize: 9, textAlign: "right" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }, chip: { borderRadius: 12, backgroundColor: "#F2E8F0", paddingHorizontal: 9, paddingVertical: 5 }, chipText: { color: "#713568", fontFamily: "Poppins-Medium", fontSize: 8 },
    state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: "#F8F5ED" }, stateText: { color: "#81767B", fontFamily: "Poppins-Regular", fontSize: 12, textAlign: "center" }, retry: { color: "#713568", fontFamily: "Poppins-SemiBold", fontSize: 12 },
});
