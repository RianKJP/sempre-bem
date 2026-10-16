import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNavItem } from "@/core/components/bottom_nav_item";
import { useHomeViewModel } from "@/features/app_prestador/home/viewmodels/use_home_view_model";

const COLORS = {
    background: "#FAF7F0",
    border: "#E7DFD8",
    green: "#94AA2F",
    greenSoft: "#F1F5E4",
    highlight: "#E9B92D",
    muted: "#7D7478",
    plum: "#743268",
    plumSoft: "#F5EDF4",
    surface: "#FFFFFF",
    text: "#2E292C",
} as const;

const SHADOW = {
    elevation: 2,
    shadowColor: "#4A3A42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
} as const;

export default function HomeView() {
    const insets = useSafeAreaInsets();
    const {
        changeProfile,
        currentCall,
        isAvailable,
        isLoadingProvider,
        isUpdatingAvailability,
        prestador,
        providerError,
        reloadProvider,
        toggleAvailability,
    } = useHomeViewModel();
    const firstName = prestador?.nome.split(" ")[0] ?? "Profissional";
    const initials = prestador
        ? prestador.nome
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join("")
        : "--";
    const isAttending = currentCall?.status === "EM_ATENDIMENTO";
    const requesterInitials = currentCall
        ? currentCall.requester
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join("")
        : "--";

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView
                alwaysBounceVertical={false}
                bounces={false}
                contentContainerStyle={[styles.content, { paddingBottom: 104 + insets.bottom }]}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.headerCopy}>
                        <Text style={styles.greeting}>
                            Olá, {firstName}! <Text style={styles.sparkle}>✦</Text>
                        </Text>
                        <Text style={styles.subtitle}>Você faz a diferença todos os dias.</Text>
                    </View>

                    <View style={styles.headerActions}>
                        <Pressable
                            accessibilityLabel="Notificações"
                            hitSlop={8}
                            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "bell", android: "notifications_none", web: "notifications_none" }}
                                size={20}
                                tintColor={COLORS.text}
                            />
                        </Pressable>
                        <Pressable
                            accessibilityLabel="Trocar perfil"
                            onPress={changeProfile}
                            style={({ pressed }) => [styles.profileAvatar, pressed && styles.pressed]}
                        >
                            <Text style={styles.profileInitials}>{initials}</Text>
                        </Pressable>
                    </View>
                </View>

                {isLoadingProvider ? (
                    <View style={styles.providerStateCard}>
                        <ActivityIndicator color={COLORS.plum} />
                        <Text style={styles.providerStateText}>Carregando profissional...</Text>
                    </View>
                ) : providerError ? (
                    <View style={styles.providerStateCard}>
                        <Text style={styles.providerErrorText}>{providerError}</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={reloadProvider}
                            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.retryButtonText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : null}

                <View style={styles.availabilityCard}>
                    <View style={styles.availabilityCopy}>
                        <View style={styles.availabilityTitleRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.availabilityTitle}>
                                {isAttending
                                    ? "Em atendimento agora"
                                    : isAvailable
                                        ? "Disponível agora"
                                        : "Indisponível"}
                            </Text>
                        </View>
                        <Text style={styles.availabilitySubtitle}>
                            {isUpdatingAvailability
                                ? "Atualizando disponibilidade..."
                                : isAttending
                                    ? `Cuidando de ${currentCall.familyMember}`
                                : isAvailable
                                    ? "Recebendo novas solicitações"
                                    : "Novas solicitações pausadas"}
                        </Text>
                    </View>
                    <Pressable
                        accessibilityLabel={isAvailable ? "Ficar indisponível" : "Ficar disponível"}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isAvailable }}
                        disabled={!prestador || isLoadingProvider || isUpdatingAvailability || isAttending}
                        onPress={toggleAvailability}
                        style={[styles.switchTrack, !isAvailable && styles.switchTrackOff]}
                    >
                        <View style={[styles.switchThumb, !isAvailable && styles.switchThumbOff]} />
                    </Pressable>
                </View>

                <Text style={[styles.sectionTitle, styles.todayTitle]}>Hoje</Text>
                <View style={styles.metricsRow}>
                    <TodayCard label="Atendimentos" value="2" />
                    <TodayCard label="Próximo horário" value="14:00" />
                    <TodayCard label="Chamado agora" value={currentCall ? "1" : "0"} />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {isAttending ? "Atendimento em andamento" : "Chamado atual"}
                    </Text>
                    <Pressable accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.sectionAction}>Ver todas</Text>
                    </Pressable>
                </View>

                {currentCall ? (
                <View style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                        <View style={styles.clientAvatar}>
                            <Text style={styles.clientInitials}>{requesterInitials}</Text>
                        </View>
                        <View style={styles.clientCopy}>
                            <Text style={styles.clientName}>{currentCall.requester}</Text>
                            <Text style={styles.clientDetails}>
                                Para {currentCall.familyMember}
                                {currentCall.caredPersonAge ? `, ${currentCall.caredPersonAge} anos` : ""}
                            </Text>
                        </View>
                        <View style={[styles.distancePill, isAttending && styles.attendingPill]}>
                            <Text style={[styles.distanceText, isAttending && styles.attendingPillText]}>
                                {isAttending ? "Em andamento" : "Novo"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <SymbolView
                                name={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
                                size={16}
                                tintColor={COLORS.text}
                            />
                            <Text style={styles.scheduleText}>{currentCall.dateLabel}</Text>
                        </View>
                        <View style={styles.scheduleItem}>
                            <SymbolView
                                name={{ ios: "clock", android: "schedule", web: "schedule" }}
                                size={16}
                                tintColor={COLORS.text}
                            />
                            <Text style={styles.scheduleText}>{currentCall.duration}</Text>
                        </View>
                    </View>
                    <Text style={styles.careDescription}>{currentCall.service}</Text>
                    <Text numberOfLines={2} style={styles.requestAddress}>{currentCall.address}</Text>

                    <Pressable
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
                    >
                        <Text style={styles.detailsButtonText}>
                            {isAttending ? "Acompanhar atendimento" : "Ver detalhes"}
                        </Text>
                    </Pressable>
                </View>
                ) : (
                    <View style={styles.emptyCallCard}>
                        <SymbolView
                            name={{ ios: "bell.slash", android: "notifications_off", web: "notifications_off" }}
                            size={28}
                            tintColor={COLORS.muted}
                        />
                        <Text style={styles.emptyCallTitle}>Nenhum chamado agora</Text>
                        <Text style={styles.emptyCallDescription}>
                            Quando uma nova solicitação chegar, ela aparecerá aqui.
                        </Text>
                    </View>
                )}

                <View style={styles.nextAppointmentCard}>
                    <Text style={styles.nextAppointmentEyebrow}>PRÓXIMO ATENDIMENTO</Text>
                    <Text style={styles.nextAppointmentTitle}>Hoje às 10:30</Text>
                    <Text style={styles.nextAppointmentDescription}>José Santos · Fisioterapia assistida</Text>
                </View>
            </ScrollView>

            <View
                style={[
                    styles.bottomNav,
                    { height: 72 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) },
                ]}
            >
                <BottomNavItem label="Início" active icon={{ ios: "house.fill", android: "home", web: "home" }} />
                <BottomNavItem label="Agenda" icon={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }} />
                <BottomNavItem label="Atendimentos" icon={{ ios: "heart", android: "favorite_border", web: "favorite_border" }} />
                <BottomNavItem label="Mensagens" icon={{ ios: "message", android: "chat_bubble_outline", web: "chat_bubble_outline" }} />
                <BottomNavItem label="Perfil" icon={{ ios: "person", android: "person_outline", web: "person_outline" }} />
            </View>
        </SafeAreaView>
    );
}

function TodayCard({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingHorizontal: 16, paddingTop: 16 },
    header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
    headerCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
    greeting: { color: COLORS.text, fontSize: 22, lineHeight: 27, fontWeight: "800" },
    sparkle: { color: COLORS.highlight, fontSize: 18 },
    subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    notificationButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    profileAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#C48465", borderWidth: 2, borderColor: COLORS.surface },
    profileInitials: { color: COLORS.surface, fontSize: 12, fontWeight: "800" },
    providerStateCard: { minHeight: 112, alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 16 },
    providerStateText: { color: COLORS.muted, fontSize: 12 },
    providerErrorText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
    retryButton: { minHeight: 36, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: COLORS.plum, paddingHorizontal: 16 },
    retryButtonText: { color: COLORS.surface, fontSize: 11, fontWeight: "800" },
    availabilityCard: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.greenSoft, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, ...SHADOW },
    availabilityCopy: { flex: 1, minWidth: 0 },
    availabilityTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
    availabilityTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    availabilitySubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginLeft: 16, marginTop: 3 },
    switchTrack: { width: 46, height: 26, borderRadius: 13, justifyContent: "center", backgroundColor: COLORS.green, paddingHorizontal: 2 },
    switchTrackOff: { backgroundColor: "#C9C4C5" },
    switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.surface, alignSelf: "flex-end" },
    switchThumbOff: { alignSelf: "flex-start" },
    sectionTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    todayTitle: { marginTop: 26 },
    metricsRow: { flexDirection: "row", gap: 9, marginTop: 12 },
    metricCard: { flex: 1, minWidth: 0, minHeight: 76, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 4, ...SHADOW },
    metricValue: { color: COLORS.plum, fontSize: 20, lineHeight: 24, fontWeight: "800" },
    metricLabel: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 4, textAlign: "center" },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 12 },
    sectionAction: { color: COLORS.plum, fontSize: 12, fontWeight: "700" },
    requestCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, ...SHADOW },
    requestHeader: { flexDirection: "row", alignItems: "center" },
    clientAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#32291E" },
    clientInitials: { color: "#F3C8A0", fontSize: 12, fontWeight: "900" },
    clientCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
    clientName: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    clientDetails: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 5 },
    ratingText: { color: COLORS.muted, fontSize: 11 },
    distancePill: { alignSelf: "flex-start", marginTop: 3, borderRadius: 8, backgroundColor: "#F7F0D3", paddingHorizontal: 10, paddingVertical: 6 },
    distanceText: { color: "#9A7D18", fontSize: 11, fontWeight: "700" },
    attendingPill: { backgroundColor: COLORS.greenSoft },
    attendingPillText: { color: COLORS.green },
    divider: { height: 1, backgroundColor: COLORS.border, marginTop: 14, marginBottom: 14 },
    scheduleRow: { flexDirection: "row", alignItems: "center", gap: 20 },
    scheduleItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    scheduleText: { color: COLORS.text, fontSize: 11 },
    careDescription: { color: COLORS.text, fontSize: 11, lineHeight: 16, marginTop: 14 },
    requestAddress: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    detailsButton: { height: 48, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.plum, borderRadius: 12, marginTop: 14 },
    detailsButtonPressed: { opacity: 0.86 },
    detailsButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: "800" },
    emptyCallCard: { minHeight: 150, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, ...SHADOW },
    emptyCallTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
    emptyCallDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: "center" },
    nextAppointmentCard: { minHeight: 112, justifyContent: "center", backgroundColor: COLORS.plumSoft, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 14, paddingHorizontal: 16, paddingVertical: 14, ...SHADOW },
    nextAppointmentEyebrow: { color: COLORS.plum, fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
    nextAppointmentTitle: { color: COLORS.text, fontSize: 15, lineHeight: 20, fontWeight: "800", marginTop: 10 },
    nextAppointmentDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
    bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
    pressed: { opacity: 0.65 },
});
