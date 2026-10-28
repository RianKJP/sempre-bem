import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    listClientDiaryEntries,
    type ClientDiaryEntry,
} from "@/features/app_cliente/diario_bordo/service/diario_bordo_service";
import { useClienteFonts } from "@/features/perfil_cliente/components/use_cliente_fonts";

export default function DiarioBordoView() {
    const router = useRouter();
    const params = useLocalSearchParams<{ familiaId?: string | string[] }>();
    const familiaId = Array.isArray(params.familiaId) ? params.familiaId[0] : params.familiaId ?? "1";
    const fontsLoaded = useClienteFonts();
    const [entries, setEntries] = useState<ClientDiaryEntry[]>([]);
    const [person, setPerson] = useState("Todos");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [reloadKey, setReloadKey] = useState(0);

    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(undefined);
        void listClientDiaryEntries(familiaId, controller.signal)
            .then(setEntries)
            .catch((failure: unknown) => {
                if (failure instanceof Error && failure.name === "AbortError") return;
                setError("Não foi possível carregar o diário de bordo.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [familiaId, reloadKey]));

    const people = useMemo(() => ["Todos", ...new Set(entries.map((entry) => entry.person))], [entries]);
    const visibleEntries = person === "Todos" ? entries : entries.filter((entry) => entry.person === person);

    if (!fontsLoaded) return <View style={styles.screen} />;

    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.bookIcon}>
                        <SymbolView name={{ ios: "book", android: "menu_book", web: "menu_book" }} size={25} tintColor="#A6B778" />
                    </View>
                    <View style={styles.headerCopy}>
                        <Text accessibilityRole="header" style={styles.title}>Diário de bordo</Text>
                        <Text style={styles.subtitle}>Acompanhe os registros dos atendimentos</Text>
                    </View>
                    <Pressable accessibilityLabel="Abrir histórico" onPress={() => router.push({ pathname: "/historico_atendimentos", params: { familiaId } })} style={styles.historyButton}>
                        <SymbolView name={{ ios: "clock.arrow.circlepath", android: "history", web: "history" }} size={22} tintColor="#713568" />
                    </Pressable>
                </View>

                {people.length > 2 ? (
                    <ScrollView horizontal contentContainerStyle={styles.filters} showsHorizontalScrollIndicator={false}>
                        {people.map((value) => (
                            <Pressable key={value} onPress={() => setPerson(value)} style={[styles.filter, person === value && styles.filterActive]}>
                                <Text style={[styles.filterText, person === value && styles.filterTextActive]}>{value}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                ) : null}

                {loading ? (
                    <View style={styles.state}><ActivityIndicator color="#713568" /><Text style={styles.stateText}>Carregando registros...</Text></View>
                ) : error ? (
                    <View style={styles.state}>
                        <SymbolView name={{ ios: "wifi.exclamationmark", android: "cloud_off", web: "cloud_off" }} size={30} tintColor="#A84F54" />
                        <Text style={styles.stateText}>{error}</Text>
                        <Pressable onPress={() => setReloadKey((value) => value + 1)}><Text style={styles.retry}>Tentar novamente</Text></Pressable>
                    </View>
                ) : visibleEntries.length ? (
                    <View style={styles.list}>
                        {visibleEntries.map((entry) => <DiaryCard entry={entry} key={entry.id} />)}
                    </View>
                ) : (
                    <View style={styles.state}>
                        <SymbolView name={{ ios: "book.closed", android: "menu_book", web: "menu_book" }} size={34} tintColor="#91A2BC" />
                        <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
                        <Text style={styles.stateText}>Os registros feitos durante os atendimentos aparecerão aqui.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function DiaryCard({ entry }: { entry: ClientDiaryEntry }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{entry.person.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.cardHeaderCopy}>
                    <Text style={styles.person}>{entry.person}</Text>
                    <Text style={styles.date}>{entry.date}</Text>
                </View>
            </View>
            <Text style={styles.entryText}>{entry.text}</Text>
            <View style={styles.divider} />
            <Text style={styles.service}>{entry.service}</Text>
            <Text style={styles.caregiver}>Registrado por {entry.caregiver}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8F5ED" },
    scroll: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, width: "100%", maxWidth: 680, alignSelf: "center" },
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    bookIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#F0F4E3", alignItems: "center", justifyContent: "center" },
    headerCopy: { flex: 1 },
    title: { fontFamily: "Poppins-SemiBold", fontSize: 21, lineHeight: 28, color: "#262326" },
    subtitle: { fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#81767B" },
    historyButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
    filters: { gap: 8, paddingVertical: 18 },
    filter: { minHeight: 38, paddingHorizontal: 15, borderRadius: 19, borderWidth: 1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF", justifyContent: "center" },
    filterActive: { backgroundColor: "#A6B778", borderColor: "#A6B778" },
    filterText: { fontFamily: "Poppins-Medium", fontSize: 11, color: "#59667B" },
    filterTextActive: { color: "#FFFFFF" },
    list: { gap: 12, marginTop: 20 },
    card: { padding: 16, borderRadius: 17, borderWidth: 1, borderColor: "#E2DCD5", backgroundColor: "#FFFFFF" },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
    avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F0F4E3", alignItems: "center", justifyContent: "center" },
    avatarText: { fontFamily: "Poppins-SemiBold", color: "#82934F", fontSize: 15 },
    cardHeaderCopy: { flex: 1 },
    person: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#262326" },
    date: { marginTop: 2, fontFamily: "Poppins-Regular", fontSize: 9, color: "#81767B" },
    entryText: { marginTop: 14, fontFamily: "Poppins-Regular", fontSize: 12, lineHeight: 19, color: "#3E383C" },
    divider: { height: 1, marginVertical: 12, backgroundColor: "#EEE8E2" },
    service: { fontFamily: "Poppins-Medium", fontSize: 10, color: "#713568" },
    caregiver: { marginTop: 3, fontFamily: "Poppins-Regular", fontSize: 9, color: "#81767B" },
    state: { minHeight: 260, marginTop: 24, padding: 24, alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 18, backgroundColor: "#FFFFFF" },
    stateText: { maxWidth: 300, fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 17, color: "#81767B", textAlign: "center" },
    emptyTitle: { fontFamily: "Poppins-SemiBold", fontSize: 14, color: "#262326" },
    retry: { fontFamily: "Poppins-SemiBold", fontSize: 12, color: "#713568" },
});
