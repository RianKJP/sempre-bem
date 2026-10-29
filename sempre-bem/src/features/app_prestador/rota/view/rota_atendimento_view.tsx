import { SymbolView } from "expo-symbols";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrentLocation } from "@/core/service/location_service";
import { RequestMap } from "@/features/app_cliente/solicitacao/components/request_map";
import {
    buscarDadosHomePrestador,
    type ChamadoAtualPrestador,
    type PrestadorApi,
} from "@/features/app_prestador/home/service/api_prestador";

const COLORS = { background: "#FAF7F0", border: "#E7DFD8", green: "#94AA2F", muted: "#7D7478", plum: "#743268", surface: "#FFFFFF", text: "#2E292C" } as const;

export default function RotaAtendimentoView() {
    const router = useRouter();
    const { prestadorId = "1" } = useLocalSearchParams<{ prestadorId?: string }>();
    const [call, setCall] = useState<ChamadoAtualPrestador | null>(null);
    const [provider, setProvider] = useState<PrestadorApi | null>(null);
    const [providerCoordinate, setProviderCoordinate] = useState<{ latitude: number; longitude: number }>();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            buscarDadosHomePrestador(String(prestadorId), controller.signal),
            getCurrentLocation(),
        ]).then(([data, location]) => {
            setCall(data.chamadoAtual);
            setProvider(data.prestador);
            if (location) setProviderCoordinate(location);
        }).catch(() => setError("Não foi possível carregar a rota do atendimento."))
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [prestadorId]);

    if (loading) {
        return <View style={styles.state}><ActivityIndicator color={COLORS.plum} /><Text style={styles.stateText}>Carregando rota...</Text></View>;
    }

    const destinationLatitude = call?.destinationLatitude ?? -23.5898;
    const destinationLongitude = call?.destinationLongitude ?? -46.6346;
    const originLatitude = providerCoordinate?.latitude ?? provider?.latitude ?? null;
    const originLongitude = providerCoordinate?.longitude ?? provider?.longitude ?? null;

    return (
        <SafeAreaView edges={["top"]} style={styles.screen}>
            <View style={styles.mapContainer}>
                <RequestMap
                    hasCurrentLocation={Boolean(call?.destinationLatitude != null && call?.destinationLongitude != null)}
                    latitude={destinationLatitude}
                    longitude={destinationLongitude}
                    providerLatitude={originLatitude}
                    providerLongitude={originLongitude}
                    routeDashed
                    showProviderRoute
                />
                <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}>
                    <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={COLORS.text} />
                </Pressable>
            </View>

            <View style={styles.sheet}>
                <Text style={styles.eyebrow}>ATENDIMENTO CONTRATADO</Text>
                <Text style={styles.title}>{call?.familyMember ?? "Pessoa cuidada"}</Text>
                <View style={styles.addressRow}>
                    <SymbolView name={{ ios: "location.fill", android: "location_on", web: "location_on" }} size={18} tintColor={COLORS.plum} />
                    <Text style={styles.address}>{call?.address ?? "Endereço não informado"}</Text>
                </View>
                {call?.destinationLatitude == null ? <Text style={styles.warning}>Este chamado não possui coordenadas salvas. Recrie-o para exibir a rota pelas ruas.</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.routeHint}>
                    <SymbolView
                        name={{ ios: "car.fill", android: "directions_car", web: "directions_car" }}
                        size={18}
                        tintColor={COLORS.green}
                    />
                    <Text style={styles.routeHintText}>
                        Siga a rota até o endereço do cliente. O atendimento deve ser iniciado pelo card da tela inicial.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    state: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.background },
    stateText: { color: COLORS.muted, fontSize: 12 },
    mapContainer: { flex: 1, minHeight: 280 },
    backButton: { position: "absolute", left: 16, top: 16, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: COLORS.surface, elevation: 5 },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 },
    eyebrow: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
    title: { color: COLORS.text, fontSize: 21, fontWeight: "900", marginTop: 4 },
    addressRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10 },
    address: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
    warning: { color: "#A06A19", fontSize: 10, lineHeight: 15, marginTop: 8 },
    error: { color: "#B85E61", fontSize: 10, marginTop: 7 },
    routeHint: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 13, backgroundColor: "#F1F5E4", marginTop: 14, paddingHorizontal: 12, paddingVertical: 11 },
    routeHintText: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 15 },
});
