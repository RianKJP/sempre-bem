import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CancelAttendanceModal } from "@/core/components/cancel_attendance_modal";
import { FinishAttendanceModal } from "@/core/components/finish_attendance_modal";
import { HomeBannerCarousel } from "@/features/app_cliente/home/components/home_banner_carousel";
import { ProfessionalCard } from "@/features/app_cliente/home/components/home_professional_card";
import type { SolicitacaoAtendimentoApi } from "@/features/app_cliente/solicitacao/service/api_solicitacao";
import {
    type HomeFamily,
    useHomeViewModel,
} from "@/features/app_cliente/home/viewmodels/use_home_view_model";

// Paleta exclusiva da home. Esta tela não depende do tema global do aplicativo.
const COLORS = {
    backdrop: "rgba(38, 35, 38, 0.45)",
    background: "#F8F5EE",
    border: "#E5DED5",
    borderMuted: "#CEC5BA",
    highlight: "#F2C94C",
    primary: "#713568",
    primarySoft: "#F7EDF5",
    secondary: "#94AA32",
    surface: "#FFFFFF",
    surfaceMuted: "#F2EEE8",
    text: "#262326",
    textMuted: "#766F73",
    white: "#FFFFFF",
} as const;

export default function HomeView() {
    const insets = useSafeAreaInsets();
    const {
        cancelActiveAttendance,
        closeFamilyPicker,
        familia,
        familiaId,
        familiares,
        finishActiveAttendance,
        familyError,
        isFamilyPickerVisible,
        isLoadingFamily,
        isLoadingProfessionals,
        openActiveDiary,
        openActiveChat,
        openClientProfile,
        openCaredPersonRegistration,
        openFamilyPicker,
        pendingRequest,
        reloadFamily,
        profissionais,
        professionalsError,
        reloadProfessionals,
        resumePendingRequest,
        selectFamily,
    } = useHomeViewModel();
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [isCancellingAttendance, setIsCancellingAttendance] = useState(false);
    const [cancelAttendanceError, setCancelAttendanceError] = useState<string>();
    const [finishModalVisible, setFinishModalVisible] = useState(false);
    const [isFinishingAttendance, setIsFinishingAttendance] = useState(false);
    const [finishAttendanceError, setFinishAttendanceError] = useState<string>();

    function closeCancelModal() {
        if (isCancellingAttendance) return;
        setCancelModalVisible(false);
        setCancelAttendanceError(undefined);
    }

    async function confirmAttendanceCancellation() {
        setIsCancellingAttendance(true);
        setCancelAttendanceError(undefined);
        const cancelled = await cancelActiveAttendance();
        setIsCancellingAttendance(false);
        if (cancelled) {
            setCancelModalVisible(false);
            return;
        }
        setCancelAttendanceError("Não foi possível cancelar. Verifique sua conexão e tente novamente.");
    }

    function closeFinishModal() {
        if (isFinishingAttendance) return;
        setFinishModalVisible(false);
        setFinishAttendanceError(undefined);
    }

    async function confirmAttendanceFinish() {
        setIsFinishingAttendance(true);
        setFinishAttendanceError(undefined);
        const finished = await finishActiveAttendance();
        setIsFinishingAttendance(false);
        if (finished) {
            setFinishModalVisible(false);
            return;
        }
        setFinishAttendanceError("Não foi possível finalizar. Verifique sua conexão e tente novamente.");
    }

    const primeiroNome = familia?.nome.split(" ")[0] ?? "Cliente";
    const iniciaisFamilia = familia
        ? familia.nome
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((parte) => parte.charAt(0).toUpperCase())
              .join("")
        : "--";

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView
                alwaysBounceVertical={false}
                bounces={false}
                contentContainerStyle={[
                    styles.content,
                    pendingRequest && !pendingRequest.atendimento_ativo && styles.contentWithPendingRequest,
                ]}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.headerCopy}>
                        <Text style={styles.greeting}>Olá, {primeiroNome}! <Text style={styles.sparkle}>✦</Text></Text>
                        <Text style={styles.headerSubtitle}>Como podemos ajudar hoje?</Text>
                        <View style={styles.locationRow}>
                            <SymbolView
                                name={{ ios: "location", android: "location_on", web: "location_on" }}
                                size={14}
                                tintColor={COLORS.secondary}
                            />
                            <Text style={styles.locationText}>Usando sua localização atual</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <Pressable
                            accessibilityLabel="Notificações"
                            hitSlop={8}
                            style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "bell", android: "notifications", web: "notifications" }}
                                size={20}
                                tintColor={COLORS.text}
                            />
                        </Pressable>
                        <Pressable
                            accessibilityLabel="Abrir perfil"
                            onPress={openClientProfile}
                            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
                        >
                            <Text style={styles.avatarText}>{iniciaisFamilia}</Text>
                        </Pressable>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>De quem você precisa cuidar?</Text>
                {isLoadingFamily ? (
                    <View style={styles.familyStateCard}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={styles.familyStateText}>Carregando familiares...</Text>
                    </View>
                ) : familyError ? (
                    <View style={styles.familyStateCard}>
                        <Text style={styles.familyErrorText}>{familyError}</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={reloadFamily}
                            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.retryButtonText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.familyRow}>
                        {familiares.map((family) => (
                            <FamilyCareCard
                                family={family}
                                key={family.id}
                                onSelect={() => selectFamily(family)}
                            />
                        ))}
                        <Pressable
                            accessibilityLabel="Adicionar familiar"
                            onPress={openFamilyPicker}
                            style={({ pressed }) => [styles.addFamilyCard, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "plus", android: "add", web: "add" }}
                                size={24}
                                tintColor={COLORS.textMuted}
                            />
                            <Text style={styles.addFamilyLabel}>Adicionar</Text>
                        </Pressable>
                    </View>
                )}

                {pendingRequest?.atendimento_ativo && pendingRequest.prestador_contratado ? (
                    pendingRequest.atendimento_ativo.status === "EM_ANDAMENTO" ? (
                        <OngoingClientCareCard
                            onCancel={() => {
                                setCancelAttendanceError(undefined);
                                setCancelModalVisible(true);
                            }}
                            onOpenDiary={openActiveDiary}
                            onChat={openActiveChat}
                            onFinish={() => {
                                setFinishAttendanceError(undefined);
                                setFinishModalVisible(true);
                            }}
                            personName={familiares.find(
                                (person) => String(person.id) === String(pendingRequest.id_idoso),
                            )?.name ?? "Pessoa cuidada"}
                            request={pendingRequest}
                        />
                    ) : (
                        <OnWayCareCard
                            onCancel={() => {
                                setCancelAttendanceError(undefined);
                                setCancelModalVisible(true);
                            }}
                            onChat={openActiveChat}
                            onOpenMap={resumePendingRequest}
                            request={pendingRequest}
                        />
                    )
                ) : null}

                <HomeBannerCarousel />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Profissionais próximos</Text>
                    <Text style={styles.sectionAction}>Ver todos</Text>
                </View>

                {isLoadingProfessionals ? (
                    <View style={styles.familyStateCard}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={styles.familyStateText}>Carregando profissionais...</Text>
                    </View>
                ) : professionalsError ? (
                    <View style={styles.familyStateCard}>
                        <Text style={styles.familyErrorText}>{professionalsError}</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={reloadProfessionals}
                            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.retryButtonText}>Tentar novamente</Text>
                        </Pressable>
                    </View>
                ) : profissionais.length ? (
                    profissionais.map((professional) => (
                        <ProfessionalCard key={professional.id} professional={professional} />
                    ))
                ) : (
                    <Text style={styles.emptyText}>Nenhum profissional disponível agora.</Text>
                )}
            </ScrollView>

            {pendingRequest && !pendingRequest.atendimento_ativo ? (
                <PendingRequestFloatingCard onPress={resumePendingRequest} />
            ) : null}

            <CancelAttendanceModal
                error={cancelAttendanceError}
                isCancelling={isCancellingAttendance}
                onClose={closeCancelModal}
                onConfirm={() => void confirmAttendanceCancellation()}
                visible={cancelModalVisible}
            />
            <FinishAttendanceModal
                error={finishAttendanceError}
                isFinishing={isFinishingAttendance}
                onClose={closeFinishModal}
                onConfirm={() => void confirmAttendanceFinish()}
                personName={familiares.find((person) => String(person.id) === String(pendingRequest?.id_idoso))?.name ?? "Pessoa cuidada"}
                visible={finishModalVisible}
            />

            <Modal
                animationType="fade"
                transparent
                visible={isFamilyPickerVisible}
                onRequestClose={closeFamilyPicker}
            >
                <View style={styles.modalRoot}>
                    <Pressable
                        accessibilityLabel="Fechar seleção de familiar"
                        onPress={closeFamilyPicker}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        style={[
                            styles.modalCard,
                            { paddingBottom: Math.max(insets.bottom, 30) },
                        ]}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.modalTitleRow}>
                            <View>
                                <Text style={styles.modalTitle}>Para quem é o cuidado?</Text>
                                <Text style={styles.modalSubtitle}>Escolha um familiar para continuar</Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Fechar"
                                onPress={closeFamilyPicker}
                                style={styles.closeButton}
                            >
                                <SymbolView
                                    name={{ ios: "xmark", android: "close", web: "close" }}
                                    size={20}
                                    tintColor={COLORS.text}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.familyList}>
                            {familiares.map((family) => (
                                <Pressable
                                    accessibilityRole="button"
                                    key={family.id}
                                    onPress={() => selectFamily(family)}
                                    style={({ pressed }) => [styles.familyOption, pressed && styles.pressed]}
                                >
                                    <View style={[styles.modalFamilyAvatar, { backgroundColor: family.color }]}>
                                        <Text style={styles.familyInitials}>{family.initials}</Text>
                                    </View>
                                    <View style={styles.familyInfo}>
                                        <Text style={styles.familyName}>{family.name}</Text>
                                        <Text style={styles.familyRelation}>
                                            {family.relation} • {family.age} anos
                                        </Text>
                                    </View>
                                    <SymbolView
                                        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                                        size={22}
                                        tintColor={COLORS.textMuted}
                                    />
                                </Pressable>
                            ))}
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCaredPersonRegistration}
                            style={({ pressed }) => [styles.addFamilyButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "person.badge.plus", android: "person_add", web: "person_add" }}
                                size={20}
                                tintColor={COLORS.white}
                            />
                            <Text style={styles.addFamilyText}>Adicionar outro familiar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function OngoingClientCareCard({
    onCancel,
    onChat,
    onFinish,
    onOpenDiary,
    personName,
    request,
}: {
    onCancel: () => void;
    onChat: () => void;
    onFinish: () => void;
    onOpenDiary: () => void;
    personName: string;
    request: SolicitacaoAtendimentoApi;
}) {
    const [now, setNow] = useState(Date.now());
    const attendance = request.atendimento_ativo;
    const provider = request.prestador_contratado;

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!attendance || !provider) return null;

    const elapsed = formatClientElapsed(attendance.data_hora_inicio, now);
    const expectedEnd = attendance.data_hora_prevista_fim
        ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })
            .format(new Date(attendance.data_hora_prevista_fim))
        : "Não informado";

    return (
        <View style={styles.ongoingClientCardWrapper}>
            <View style={styles.ongoingClientCard}>
                <View style={styles.ongoingClientHeader}>
                    <View style={styles.ongoingClientStatusDot} />
                    <Text style={styles.ongoingClientStatus}>ATENDIMENTO EM ANDAMENTO</Text>
                    <View style={styles.ongoingClientRecordsPill}>
                        <Text style={styles.ongoingClientRecordsText}>
                            {attendance.registros_diario?.length ?? 0} registros
                        </Text>
                    </View>
                </View>

                <Text style={styles.ongoingClientPerson}>{personName}</Text>
                <Text style={styles.ongoingClientProvider}>Profissional: {provider.nome}</Text>

                <View style={styles.ongoingClientTimer}>
                    <Text style={styles.ongoingClientTimerLabel}>TEMPO DECORRIDO</Text>
                    <Text style={styles.ongoingClientTimerValue}>{elapsed}</Text>
                    <Text style={styles.ongoingClientTimerEnd}>Término previsto: {expectedEnd}</Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    onPress={onOpenDiary}
                    style={({ pressed }) => [styles.ongoingClientPrimaryButton, pressed && styles.pressed]}
                >
                    <SymbolView
                        name={{ ios: "book", android: "menu_book", web: "menu_book" }}
                        size={18}
                        tintColor={COLORS.white}
                    />
                    <Text style={styles.ongoingClientPrimaryText}>Acompanhar registros</Text>
                </Pressable>

                <Pressable accessibilityRole="button" onPress={onChat} style={({ pressed }) => [styles.ongoingClientChatButton, pressed && styles.pressed]}>
                    <SymbolView name={{ ios: "message.fill", android: "chat", web: "chat" }} size={17} tintColor={COLORS.primary} />
                    <Text style={styles.ongoingClientChatText}>Conversar com o profissional</Text>
                </Pressable>

                <Pressable accessibilityRole="button" onPress={onFinish} style={({ pressed }) => [styles.finishAttendanceButton, pressed && styles.pressed]}>
                    <SymbolView name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} size={18} tintColor={COLORS.white} />
                    <Text style={styles.finishAttendanceText}>Finalizar atendimento</Text>
                </Pressable>

                <Pressable
                    accessibilityRole="button"
                    onPress={onCancel}
                    style={({ pressed }) => [styles.cancelAttendanceButton, pressed && styles.pressed]}
                >
                    <Text style={styles.cancelAttendanceText}>Cancelar atendimento</Text>
                </Pressable>
            </View>
        </View>
    );
}

function formatClientElapsed(startTime: string | null, now: number) {
    if (!startTime) return "00:00:00";
    const totalSeconds = Math.max(0, Math.floor((now - Date.parse(startTime)) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function OnWayCareCard({
    onCancel,
    onChat,
    onOpenMap,
    request,
}: {
    onCancel: () => void;
    onChat: () => void;
    onOpenMap: () => void;
    request: SolicitacaoAtendimentoApi;
}) {
    const provider = request.prestador_contratado;
    if (!provider) return null;

    const role = provider.tipo_profissional === "ENFERMEIRO" ? "Enfermeiro" : "Cuidador";
    const initials = provider.nome.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");

    return (
        <View style={styles.onWayCardWrapper}>
            <View style={styles.onWayCard}>
                <View style={styles.onWayHeader}>
                    <View style={styles.onWayStatusDot} />
                    <Text style={styles.onWayStatus}>
                        {request.atendimento_ativo?.status === "EM_ANDAMENTO"
                            ? "ATENDIMENTO EM ANDAMENTO"
                            : "PROFISSIONAL A CAMINHO"}
                    </Text>
                    <View style={styles.onWayCodePill}>
                        <Text style={styles.onWayCodeLabel}>CÓDIGO</Text>
                        <Text style={styles.onWayCode}>{request.atendimento_ativo?.codigo_inicio ?? "----"}</Text>
                    </View>
                </View>
                <View style={styles.onWayProviderRow}>
                    <View style={styles.onWayAvatar}><Text style={styles.onWayInitials}>{initials}</Text></View>
                    <View style={styles.onWayProviderCopy}>
                        <Text numberOfLines={1} style={styles.onWayProviderName}>{provider.nome}</Text>
                        <Text style={styles.onWayProviderMeta}>
                            {role} · {(provider.nota_media ?? 0).toFixed(1)} ★ · {provider.atendimentos_concluidos ?? 0} chamados
                        </Text>
                        <Text style={styles.onWayPrice}>{formatHomeMoney(provider.valor_total)}</Text>
                    </View>
                </View>
                <View style={styles.onWayActions}>
                    <Pressable accessibilityRole="button" onPress={onChat} style={({ pressed }) => [styles.onWaySecondaryButton, pressed && styles.pressed]}>
                        <SymbolView name={{ ios: "message", android: "chat", web: "chat" }} size={16} tintColor={COLORS.primary} />
                        <Text style={styles.onWaySecondaryText}>Chat</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={onOpenMap} style={({ pressed }) => [styles.onWayPrimaryButton, pressed && styles.pressed]}>
                        <SymbolView name={{ ios: "map.fill", android: "map", web: "map" }} size={16} tintColor={COLORS.white} />
                        <Text style={styles.onWayPrimaryText}>Voltar ao mapa</Text>
                    </Pressable>
                </View>
                <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.cancelAttendanceButton, pressed && styles.pressed]}>
                    <Text style={styles.cancelAttendanceText}>Cancelar atendimento</Text>
                </Pressable>
            </View>
        </View>
    );
}

function formatHomeMoney(value: number) {
    return new Intl.NumberFormat("pt-BR", { currency: "BRL", minimumFractionDigits: 2, style: "currency" }).format(value);
}

function PendingRequestFloatingCard({ onPress }: { onPress: () => void }) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    duration: 1100,
                    toValue: -5,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    duration: 1100,
                    toValue: 0,
                    useNativeDriver: true,
                }),
            ]),
        );

        animation.start();
        return () => {
            animation.stop();
            translateY.setValue(0);
        };
    }, [translateY]);

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[styles.pendingRequestWrapper, { transform: [{ translateY }] }]}
        >
            <Pressable
                accessibilityLabel="Voltar ao chamado pendente"
                accessibilityRole="button"
                onPress={onPress}
                style={({ pressed }) => [styles.pendingRequestCard, pressed && styles.pressed]}
            >
                <View style={styles.pendingRequestIcon}>
                    <SymbolView
                        name={{ ios: "wave.3.right", android: "radar", web: "radar" }}
                        size={24}
                        tintColor={COLORS.white}
                    />
                </View>
                <View style={styles.pendingRequestCopy}>
                    <Text style={styles.pendingRequestTitle}>Chamado em andamento</Text>
                    <Text numberOfLines={1} style={styles.pendingRequestDescription}>
                        Buscando um prestador disponível
                    </Text>
                </View>
                <View style={styles.pendingRequestAction}>
                    <Text style={styles.pendingRequestActionText}>Retornar</Text>
                    <SymbolView
                        name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
                        size={16}
                        tintColor={COLORS.primary}
                    />
                </View>
            </Pressable>
        </Animated.View>
    );
}

function FamilyCareCard({ family, onSelect }: { family: HomeFamily; onSelect: () => void }) {
    return (
        <View style={styles.familyCard}>
            <View style={[styles.familyAvatar, { backgroundColor: family.color }]}>
                <Text style={styles.familyInitials}>{family.initials}</Text>
            </View>
            <Text numberOfLines={1} style={styles.familyCardName}>{family.name}</Text>
            <Text style={styles.familyAge}>{family.age} anos</Text>
            <Text numberOfLines={1} style={styles.familyCare}>{family.care}</Text>
            <Pressable
                accessibilityLabel={`Selecionar ${family.name}`}
                onPress={onSelect}
                style={({ pressed }) => [styles.selectFamilyButton, pressed && styles.pressed]}
            >
                <Text style={styles.selectFamilyText}>Selecionar</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
    contentWithPendingRequest: { paddingBottom: 118 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 },
    headerCopy: { flex: 1, paddingRight: 12 },
    greeting: { color: COLORS.text, fontSize: 22, lineHeight: 27, fontWeight: "800" },
    sparkle: { color: COLORS.highlight, fontSize: 18 },
    headerSubtitle: { color: COLORS.text, fontSize: 13, marginTop: 2 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 11 },
    locationText: { color: COLORS.secondary, fontSize: 11, fontWeight: "600" },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    notificationButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.surface },
    avatarText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
    sectionTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    familyRow: { flexDirection: "row", gap: 9, marginTop: 12 },
    familyStateCard: { minHeight: 112, marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", gap: 12, padding: 16 },
    familyStateText: { color: COLORS.textMuted, fontSize: 12 },
    familyErrorText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center" },
    retryButton: { minHeight: 36, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
    retryButtonText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
    familyCard: { flex: 1, minWidth: 0, minHeight: 174, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 9, paddingTop: 11, paddingBottom: 10, alignItems: "stretch" },
    familyAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "flex-start", marginBottom: 8 },
    familyInitials: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
    familyCardName: { color: COLORS.text, fontSize: 12, lineHeight: 16, fontWeight: "800" },
    familyAge: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },
    familyCare: { color: COLORS.secondary, fontSize: 9, lineHeight: 12, marginTop: 5, marginBottom: 8 },
    selectFamilyButton: { minHeight: 29, marginTop: "auto", borderRadius: 8, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    selectFamilyText: { color: COLORS.white, fontSize: 9, fontWeight: "800" },
    addFamilyCard: { flex: 0.72, minWidth: 0, minHeight: 174, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.borderMuted, alignItems: "center", justifyContent: "center", gap: 6 },
    addFamilyLabel: { color: COLORS.text, fontSize: 10 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 },
    sectionAction: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
    emptyText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center", paddingVertical: 18 },
    pressed: { opacity: 0.65 },
    modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: COLORS.backdrop },
    modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
    modalHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: COLORS.borderMuted, marginBottom: 18 },
    modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
    modalSubtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 5 },
    closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceMuted, alignItems: "center", justifyContent: "center" },
    familyList: { gap: 9, marginTop: 20 },
    familyOption: { minHeight: 70, flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    modalFamilyAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    familyInfo: { flex: 1, marginLeft: 13 },
    familyName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
    familyRelation: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
    addFamilyButton: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, backgroundColor: COLORS.primary, borderRadius: 14 },
    addFamilyText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
    pendingRequestWrapper: { position: "absolute", left: 14, right: 14, bottom: 12 },
    pendingRequestCard: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 19, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 10, elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 9 },
    pendingRequestIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(255, 255, 255, 0.17)" },
    pendingRequestCopy: { flex: 1, minWidth: 0 },
    pendingRequestTitle: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
    pendingRequestDescription: { color: "rgba(255, 255, 255, 0.78)", fontSize: 10, lineHeight: 14, marginTop: 3 },
    pendingRequestAction: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 2, borderRadius: 10, backgroundColor: COLORS.white, paddingHorizontal: 10 },
    pendingRequestActionText: { color: COLORS.primary, fontSize: 10, lineHeight: 12, fontWeight: "800", textAlign: "center" },
    ongoingClientCardWrapper: { width: "100%", marginTop: 18, marginBottom: 4 },
    ongoingClientCard: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#D7E1B8", backgroundColor: COLORS.surface, padding: 15, elevation: 7, shadowColor: COLORS.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 9 },
    ongoingClientHeader: { flexDirection: "row", alignItems: "center" },
    ongoingClientStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary, marginRight: 7 },
    ongoingClientStatus: { flex: 1, color: COLORS.secondary, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
    ongoingClientRecordsPill: { borderRadius: 8, backgroundColor: "#F0F4E3", paddingHorizontal: 8, paddingVertical: 5 },
    ongoingClientRecordsText: { color: "#82934F", fontSize: 8, fontWeight: "800" },
    ongoingClientPerson: { color: COLORS.text, fontSize: 18, lineHeight: 23, fontWeight: "900", marginTop: 13 },
    ongoingClientProvider: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
    ongoingClientTimer: { alignItems: "center", borderRadius: 17, backgroundColor: COLORS.primarySoft, marginTop: 14, paddingVertical: 15 },
    ongoingClientTimerLabel: { color: COLORS.primary, fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
    ongoingClientTimerValue: { color: COLORS.primary, fontSize: 31, fontWeight: "900", letterSpacing: 1.5, marginTop: 3 },
    ongoingClientTimerEnd: { color: COLORS.textMuted, fontSize: 9, marginTop: 3 },
    ongoingClientPrimaryButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, backgroundColor: COLORS.primary, marginTop: 13 },
    ongoingClientPrimaryText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
    ongoingClientChatButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, marginTop: 8 },
    ongoingClientChatText: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },
    finishAttendanceButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, backgroundColor: "#738D2E", marginTop: 8 },
    finishAttendanceText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
    onWayCardWrapper: { width: "100%", marginTop: 18, marginBottom: 4 },
    onWayCard: { borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.surface, padding: 13, elevation: 9, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10 },
    onWayHeader: { flexDirection: "row", alignItems: "center" },
    onWayStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary, marginRight: 6 },
    onWayStatus: { flex: 1, color: COLORS.secondary, fontSize: 8, fontWeight: "900", letterSpacing: 0.45 },
    onWayCodePill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, backgroundColor: COLORS.primarySoft, paddingHorizontal: 8, paddingVertical: 5 },
    onWayCodeLabel: { color: COLORS.textMuted, fontSize: 7, fontWeight: "800" },
    onWayCode: { color: COLORS.primary, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
    onWayProviderRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
    onWayAvatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: COLORS.primary },
    onWayInitials: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
    onWayProviderCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
    onWayProviderName: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
    onWayProviderMeta: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
    onWayPrice: { color: COLORS.primary, fontSize: 11, fontWeight: "900", marginTop: 3 },
    onWayActions: { flexDirection: "row", gap: 8, marginTop: 11 },
    onWaySecondaryButton: { flex: 0.75, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary },
    onWaySecondaryText: { color: COLORS.primary, fontSize: 10, fontWeight: "900" },
    onWayPrimaryButton: { flex: 1.25, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, backgroundColor: COLORS.primary },
    onWayPrimaryText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
    cancelAttendanceButton: { minHeight: 34, alignItems: "center", justifyContent: "center", marginTop: 4 },
    cancelAttendanceText: { color: "#B64E55", fontSize: 10, fontWeight: "800", textDecorationLine: "underline" },
});
