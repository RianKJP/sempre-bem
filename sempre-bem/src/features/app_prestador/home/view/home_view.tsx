import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CancelAttendanceModal } from "@/core/components/cancel_attendance_modal";
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        minimumFractionDigits: 2,
        style: "currency",
    }).format(value);
}

function formatElapsed(startTime: string | null, now: number) {
    if (!startTime) return "00:00:00";
    const totalSeconds = Math.max(0, Math.floor((now - Date.parse(startTime)) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export default function HomeView() {
    const {
        acceptCallError,
        acceptCurrentCall,
        cancelCurrentAttendance,
        clearAcceptCallError,
        currentCall,
        goToAttendanceRecords,
        isAvailable,
        isAcceptingCall,
        isCancellingAttendance,
        isLoadingProvider,
        isStartingAttendance,
        isUpdatingAvailability,
        prestador,
        providerError,
        reloadProvider,
        openCurrentCallRoute,
        openCurrentChat,
        openProviderProfile,
        startCurrentAttendance,
        toggleAvailability,
    } = useHomeViewModel();
    const [callDetailsModalVisible, setCallDetailsModalVisible] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelAttendanceError, setCancelAttendanceError] = useState<string>();
    const [startCodeDigits, setStartCodeDigits] = useState(["", "", "", ""]);
    const [startConfirmVisible, setStartConfirmVisible] = useState(false);
    const [startAttendanceError, setStartAttendanceError] = useState<string>();
    const [clockNow, setClockNow] = useState(Date.now());
    const requestPulse = useRef(new Animated.Value(0)).current;
    const codeInputRefs = useRef<Array<TextInput | null>>([]);
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
    const isOnWay = currentCall?.status === "A_CAMINHO";
    const isAwaitingClient = currentCall?.status === "AGUARDANDO_CLIENTE";
    const isStartCodeComplete = startCodeDigits.every(Boolean);
    const requesterInitials = currentCall
        ? currentCall.requester
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join("")
        : "--";
    const requestCardScale = requestPulse.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.012, 1],
    });
    const pulseBorderOpacity = requestPulse.interpolate({
        inputRange: [0, 0.18, 1],
        outputRange: [0.7, 0.55, 0],
    });
    const pulseBorderScale = requestPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.07],
    });

    function closeCancelModal() {
        if (isCancellingAttendance) return;
        setCancelModalVisible(false);
        setCancelAttendanceError(undefined);
    }

    async function confirmAttendanceCancellation() {
        setCancelAttendanceError(undefined);
        const cancelled = await cancelCurrentAttendance();
        if (cancelled) {
            setCancelModalVisible(false);
            return;
        }
        setCancelAttendanceError("Não foi possível cancelar. Verifique sua conexão e tente novamente.");
    }

    function changeStartCodeDigit(index: number, value: string) {
        const digit = value.replace(/\D/g, "").slice(-1);
        setStartAttendanceError(undefined);
        setStartCodeDigits((current) => current.map((item, itemIndex) =>
            itemIndex === index ? digit : item));
        if (digit && index < 3) {
            codeInputRefs.current[index + 1]?.focus();
        }
    }

    function handleStartCodeKey(index: number, key: string) {
        if (key !== "Backspace" || startCodeDigits[index] || index === 0) return;
        setStartCodeDigits((current) => current.map((item, itemIndex) =>
            itemIndex === index - 1 ? "" : item));
        codeInputRefs.current[index - 1]?.focus();
    }

    async function confirmAttendanceStart() {
        const started = await startCurrentAttendance(startCodeDigits.join(""));
        if (started) {
            setStartConfirmVisible(false);
            setStartAttendanceError(undefined);
            setStartCodeDigits(["", "", "", ""]);
            return;
        }
        setStartConfirmVisible(false);
        setStartAttendanceError("Código inválido ou não foi possível iniciar. Confira e tente novamente.");
    }

    useEffect(() => {
        if (currentCall?.status !== "PENDENTE") {
            requestPulse.stopAnimation();
            requestPulse.setValue(0);
            return;
        }

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(requestPulse, {
                    duration: 1250,
                    toValue: 1,
                    useNativeDriver: true,
                }),
                Animated.delay(350),
                Animated.timing(requestPulse, {
                    duration: 0,
                    toValue: 0,
                    useNativeDriver: true,
                }),
            ]),
        );

        animation.start();
        return () => animation.stop();
    }, [currentCall?.id, currentCall?.status, requestPulse]);

    useEffect(() => {
        if (!isAttending) return;
        setClockNow(Date.now());
        const interval = setInterval(() => setClockNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [currentCall?.appointmentId, isAttending]);

    useEffect(() => {
        if (isOnWay) return;
        setStartCodeDigits(["", "", "", ""]);
        setStartAttendanceError(undefined);
        setStartConfirmVisible(false);
    }, [currentCall?.appointmentId, isOnWay]);

    function openCallDetailsModal() {
        clearAcceptCallError();
        setCallDetailsModalVisible(true);
    }

    function closeCallDetailsModal() {
        if (isAcceptingCall) return;
        clearAcceptCallError();
        setCallDetailsModalVisible(false);
    }

    async function acceptCall() {
        const accepted = await acceptCurrentCall();
        if (accepted) setCallDetailsModalVisible(false);
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView
                alwaysBounceVertical={false}
                bounces={false}
                contentContainerStyle={styles.content}
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
                            accessibilityLabel="Abrir perfil"
                            onPress={openProviderProfile}
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

                <View style={[
                    styles.availabilityCard,
                    isAvailable && styles.availabilityCardOnline,
                    !isAvailable && !isOnWay && !isAttending && styles.availabilityCardOffline,
                    isOnWay && styles.availabilityCardOnWay,
                    isAttending && styles.availabilityCardAttending,
                ]}>
                    <View style={styles.availabilityCopy}>
                        <View style={styles.availabilityTitleRow}>
                            <View style={[
                                styles.availabilityDot,
                                isAvailable && styles.availabilityDotOnline,
                                !isAvailable && !isOnWay && !isAttending && styles.availabilityDotOffline,
                                isOnWay && styles.availabilityDotOnWay,
                                isAttending && styles.availabilityDotAttending,
                            ]} />
                            <Text style={[
                                styles.availabilityTitle,
                                !isAvailable && !isOnWay && !isAttending && styles.availabilityTitleOffline,
                                isOnWay && styles.availabilityTitleOnWay,
                                isAttending && styles.availabilityTitleAttending,
                            ]}>
                                {isAttending
                                    ? "Em atendimento agora"
                                    : isOnWay
                                        ? "Atendimento confirmado"
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
                                : isOnWay
                                    ? `A caminho de ${currentCall.familyMember}`
                                : isAvailable
                                    ? "Recebendo novas solicitações"
                                    : "Novas solicitações pausadas"}
                        </Text>
                    </View>
                    {isAttending || isOnWay ? (
                        <View style={[
                            styles.busyStatusIcon,
                            isOnWay && styles.busyStatusIconOnWay,
                            isAttending && styles.busyStatusIconAttending,
                        ]}>
                            <SymbolView
                                name={isAttending
                                    ? { ios: "timer", android: "timer", web: "timer" }
                                    : { ios: "location.fill", android: "location_on", web: "location_on" }}
                                size={21}
                                tintColor={isAttending ? "#A06A19" : COLORS.plum}
                            />
                        </View>
                    ) : (
                        <Pressable
                            accessibilityLabel={isAvailable ? "Ficar indisponível" : "Ficar disponível"}
                            accessibilityRole="switch"
                            accessibilityState={{ checked: isAvailable }}
                            disabled={!prestador || isLoadingProvider || isUpdatingAvailability}
                            onPress={toggleAvailability}
                            style={[styles.switchTrack, !isAvailable && styles.switchTrackOff]}
                        >
                            <View style={[styles.switchThumb, !isAvailable && styles.switchThumbOff]} />
                        </Pressable>
                    )}
                </View>

                <Text style={[styles.sectionTitle, styles.todayTitle]}>Hoje</Text>
                <View style={styles.metricsRow}>
                    <TodayCard label="Atendimentos" value="2" />
                    <TodayCard label="Próximo horário" value="14:00" />
                    <TodayCard label="Chamado agora" value={currentCall ? "1" : "0"} />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {isAttending
                            ? "Atendimento em andamento"
                            : isAwaitingClient
                                ? "Candidatura enviada"
                                : "Chamado atual"}
                    </Text>
                    <Pressable accessibilityRole="button" hitSlop={8}>
                        <Text style={styles.sectionAction}>Ver todas</Text>
                    </Pressable>
                </View>

                {currentCall ? (isOnWay ? (
                    <View style={styles.onWayCard}>
                        <View style={styles.onWayHeader}>
                            <View style={styles.onWayIcon}>
                                <SymbolView
                                    name={{ ios: "location.fill", android: "location_on", web: "location_on" }}
                                    size={22}
                                    tintColor={COLORS.surface}
                                />
                            </View>
                            <View style={styles.onWayHeaderCopy}>
                                <Text style={styles.onWayEyebrow}>ATENDIMENTO CONTRATADO</Text>
                                <Text style={styles.onWayTitle}>{currentCall.familyMember}</Text>
                                <Text style={styles.onWayRequester}>Solicitado por {currentCall.requester}</Text>
                            </View>
                            <View style={styles.onWayStatusPill}>
                                <Text style={styles.onWayStatusText}>A caminho</Text>
                            </View>
                        </View>

                        <View style={styles.onWayAddressRow}>
                            <SymbolView
                                name={{ ios: "mappin.and.ellipse", android: "distance", web: "distance" }}
                                size={18}
                                tintColor={COLORS.plum}
                            />
                            <Text numberOfLines={2} style={styles.onWayAddress}>{currentCall.address}</Text>
                        </View>

                        <View style={styles.startCodeSection}>
                            <Text style={styles.startCodeTitle}>Código de início</Text>
                            <Text style={styles.startCodeDescription}>
                                Peça ao cliente o código de quatro números para iniciar o atendimento.
                            </Text>
                            <View style={styles.startCodeRow}>
                                {startCodeDigits.map((digit, index) => (
                                    <TextInput
                                        accessibilityLabel={`Dígito ${index + 1} do código de início`}
                                        key={index}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        onChangeText={(value) => changeStartCodeDigit(index, value)}
                                        onKeyPress={({ nativeEvent }) => handleStartCodeKey(index, nativeEvent.key)}
                                        ref={(input) => { codeInputRefs.current[index] = input; }}
                                        selectTextOnFocus
                                        style={[styles.startCodeInput, digit && styles.startCodeInputFilled]}
                                        value={digit}
                                    />
                                ))}
                            </View>
                            {startAttendanceError ? (
                                <Text style={styles.startAttendanceError}>{startAttendanceError}</Text>
                            ) : null}
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            disabled={!isStartCodeComplete || isStartingAttendance}
                            onPress={() => setStartConfirmVisible(true)}
                            style={({ pressed }) => [
                                styles.startAttendanceButton,
                                (!isStartCodeComplete || isStartingAttendance) && styles.startAttendanceButtonDisabled,
                                pressed && styles.detailsButtonPressed,
                            ]}
                        >
                            {isStartingAttendance
                                ? <ActivityIndicator color={COLORS.surface} size="small" />
                                : <Text style={styles.startAttendanceButtonText}>Iniciar atendimento</Text>}
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCurrentCallRoute}
                            style={({ pressed }) => [styles.openMapButton, pressed && styles.detailsButtonPressed]}
                        >
                            <SymbolView
                                name={{ ios: "map", android: "map", web: "map" }}
                                size={18}
                                tintColor={COLORS.plum}
                            />
                            <Text style={styles.openMapButtonText}>Ir para o mapa</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCurrentChat}
                            style={({ pressed }) => [styles.openMapButton, pressed && styles.detailsButtonPressed]}
                        >
                            <SymbolView name={{ ios: "message.fill", android: "chat", web: "chat" }} size={18} tintColor={COLORS.plum} />
                            <Text style={styles.openMapButtonText}>Conversar com o cliente</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            disabled={isCancellingAttendance}
                            onPress={() => {
                                setCancelAttendanceError(undefined);
                                setCancelModalVisible(true);
                            }}
                            style={({ pressed }) => [styles.onWayCancelButton, pressed && styles.pressed]}
                        >
                            {isCancellingAttendance
                                ? <ActivityIndicator color="#B85E61" size="small" />
                                : <Text style={styles.cancelAttendanceText}>Cancelar atendimento</Text>}
                        </Pressable>
                    </View>
                ) : isAttending ? (
                    <View style={styles.ongoingCard}>
                        <View style={styles.ongoingHeader}>
                            <View style={styles.ongoingHeaderCopy}>
                                <Text style={styles.ongoingEyebrow}>ATENDIMENTO EM ANDAMENTO</Text>
                                <Text style={styles.ongoingTitle}>{currentCall.familyMember}</Text>
                                <Text style={styles.ongoingPatientInfo}>
                                    {currentCall.caredPersonAge ? `${currentCall.caredPersonAge} anos` : "Idade não informada"}
                                    {currentCall.sex ? ` · ${currentCall.sex}` : ""}
                                </Text>
                            </View>
                            <View style={styles.ongoingLivePill}>
                                <View style={styles.ongoingLiveDot} />
                                <Text style={styles.ongoingLiveText}>Em andamento</Text>
                            </View>
                        </View>

                        <View style={styles.timerCard}>
                            <Text style={styles.timerLabel}>TEMPO DECORRIDO</Text>
                            <Text style={styles.timerValue}>{formatElapsed(currentCall.startTime, clockNow)}</Text>
                            <Text style={styles.timerEnd}>
                                Término previsto: {currentCall.endTime
                                    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(currentCall.endTime))
                                    : "não informado"}
                            </Text>
                        </View>

                        <View style={styles.ongoingSummaryRow}>
                            <View style={styles.ongoingSummaryItem}>
                                <Text style={styles.ongoingSummaryLabel}>DURAÇÃO</Text>
                                <Text style={styles.ongoingSummaryValue}>{currentCall.duration}</Text>
                            </View>
                            <View style={styles.callMetaDivider} />
                            <View style={styles.ongoingSummaryItem}>
                                <Text style={styles.ongoingSummaryLabel}>SERVIÇOS</Text>
                                <Text numberOfLines={2} style={styles.ongoingSummaryValue}>{currentCall.service}</Text>
                            </View>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            onPress={goToAttendanceRecords}
                            style={({ pressed }) => [styles.recordButton, pressed && styles.detailsButtonPressed]}
                        >
                            <SymbolView
                                name={{ ios: "square.and.pencil", android: "edit_note", web: "edit_note" }}
                                size={20}
                                tintColor={COLORS.surface}
                            />
                            <Text style={styles.recordButtonText}>Acompanhar atendimento</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCurrentChat}
                            style={({ pressed }) => [styles.openMapButton, pressed && styles.detailsButtonPressed]}
                        >
                            <SymbolView name={{ ios: "message.fill", android: "chat", web: "chat" }} size={18} tintColor={COLORS.plum} />
                            <Text style={styles.openMapButtonText}>Conversar com o cliente</Text>
                        </Pressable>

                        <Pressable
                            accessibilityRole="button"
                            disabled={isCancellingAttendance}
                            onPress={() => {
                                setCancelAttendanceError(undefined);
                                setCancelModalVisible(true);
                            }}
                            style={({ pressed }) => [styles.ongoingCancelButton, pressed && styles.pressed]}
                        >
                            {isCancellingAttendance
                                ? <ActivityIndicator color="#B85E61" size="small" />
                                : <Text style={styles.cancelAttendanceText}>Cancelar atendimento</Text>}
                        </Pressable>
                    </View>
                ) : (
                <View style={styles.requestCardWrapper}>
                    {currentCall.status === "PENDENTE" ? (
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.requestPulseBorder,
                                {
                                    opacity: pulseBorderOpacity,
                                    transform: [{ scale: pulseBorderScale }],
                                },
                            ]}
                        />
                    ) : null}
                <Animated.View
                    style={[
                        styles.requestCard,
                        currentCall.status === "PENDENTE" && { transform: [{ scale: requestCardScale }] },
                    ]}
                >
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
                        <View style={[
                            styles.distancePill,
                            isAttending && styles.attendingPill,
                            isAwaitingClient && styles.awaitingPill,
                        ]}>
                            <Text style={[
                                styles.distanceText,
                                isAttending && styles.attendingPillText,
                                isAwaitingClient && styles.awaitingPillText,
                            ]}>
                                {isAttending
                                    ? "Em andamento"
                                    : isOnWay
                                        ? "Contratado"
                                        : isAwaitingClient
                                            ? "Em análise"
                                            : "Novo"}
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

                    {isAwaitingClient ? (
                        <View style={styles.awaitingChoiceCard}>
                            <View style={styles.awaitingChoiceIcon}>
                                <SymbolView
                                    name={{ ios: "hourglass", android: "hourglass_top", web: "hourglass_top" }}
                                    size={20}
                                    tintColor={COLORS.plum}
                                />
                            </View>
                            <View style={styles.awaitingChoiceCopy}>
                                <Text style={styles.awaitingChoiceTitle}>O cliente está escolhendo o profissional</Text>
                                <Text style={styles.awaitingChoiceDescription}>
                                    Em breve você receberá o retorno se foi contratado para este atendimento.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Pressable
                            accessibilityRole="button"
                            onPress={openCallDetailsModal}
                            style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
                        >
                            <Text style={styles.detailsButtonText}>
                                Ver detalhes
                            </Text>
                        </Pressable>
                    )}
                </Animated.View>
                </View>
                )
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

            <CancelAttendanceModal
                error={cancelAttendanceError}
                isCancelling={isCancellingAttendance}
                onClose={closeCancelModal}
                onConfirm={() => void confirmAttendanceCancellation()}
                visible={cancelModalVisible}
            />

            <Modal
                animationType="fade"
                onRequestClose={() => !isStartingAttendance && setStartConfirmVisible(false)}
                statusBarTranslucent
                transparent
                visible={startConfirmVisible}
            >
                <View style={styles.startConfirmOverlay}>
                    <View style={styles.startConfirmCard}>
                        <View style={styles.startConfirmIcon}>
                            <SymbolView
                                name={{ ios: "play.fill", android: "play_arrow", web: "play_arrow" }}
                                size={25}
                                tintColor={COLORS.green}
                            />
                        </View>
                        <Text style={styles.startConfirmTitle}>Iniciar atendimento?</Text>
                        <Text style={styles.startConfirmDescription}>
                            Confirme o código {startCodeDigits.join("")} para iniciar o cronômetro do atendimento de {currentCall?.familyMember}.
                        </Text>
                        <View style={styles.startConfirmActions}>
                            <Pressable
                                disabled={isStartingAttendance}
                                onPress={() => setStartConfirmVisible(false)}
                                style={styles.startConfirmBackButton}
                            >
                                <Text style={styles.startConfirmBackText}>Voltar</Text>
                            </Pressable>
                            <Pressable
                                disabled={isStartingAttendance}
                                onPress={() => void confirmAttendanceStart()}
                                style={styles.startConfirmButton}
                            >
                                {isStartingAttendance
                                    ? <ActivityIndicator color={COLORS.surface} size="small" />
                                    : <Text style={styles.startConfirmButtonText}>Confirmar início</Text>}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                onRequestClose={closeCallDetailsModal}
                statusBarTranslucent
                transparent
                visible={callDetailsModalVisible && Boolean(currentCall)}
            >
                <View style={styles.callDetailsOverlay}>
                    <Pressable
                        accessibilityLabel="Fechar detalhes do chamado"
                        disabled={isAcceptingCall}
                        onPress={closeCallDetailsModal}
                        style={StyleSheet.absoluteFill}
                    />
                    {currentCall ? (
                        <View accessibilityViewIsModal style={styles.callDetailsCard}>
                            <View style={styles.callDetailsHeader}>
                                <View style={styles.callDetailsHeaderCopy}>
                                    <Text style={styles.callDetailsEyebrow}>
                                        {isAttending ? "ATENDIMENTO EM ANDAMENTO" : "NOVO CHAMADO"}
                                    </Text>
                                    <Text style={styles.callDetailsTitle}>Detalhes do atendimento</Text>
                                </View>
                                <Pressable
                                    accessibilityLabel="Fechar"
                                    disabled={isAcceptingCall}
                                    hitSlop={8}
                                    onPress={closeCallDetailsModal}
                                    style={styles.callDetailsClose}
                                >
                                    <SymbolView
                                        name={{ ios: "xmark", android: "close", web: "close" }}
                                        size={20}
                                        tintColor={COLORS.text}
                                    />
                                </Pressable>
                            </View>

                            <ScrollView
                                contentContainerStyle={styles.callDetailsContent}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.patientSummary}>
                                    <View style={styles.patientSummaryAvatar}>
                                        <Text style={styles.patientSummaryInitials}>{currentCall.familyMember.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.patientSummaryCopy}>
                                        <Text style={styles.patientSummaryName}>{currentCall.familyMember}</Text>
                                        <Text style={styles.patientSummaryMeta}>
                                            {currentCall.caredPersonAge ? `${currentCall.caredPersonAge} anos` : "Idade não informada"}
                                            {currentCall.sex ? ` · ${currentCall.sex}` : ""}
                                        </Text>
                                        <Text numberOfLines={2} style={styles.patientSummaryRequester}>
                                            Solicitado por {currentCall.requester}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.callMetaRow}>
                                    <View style={styles.callMetaItem}>
                                        <Text style={styles.callMetaLabel}>QUANDO</Text>
                                        <Text style={styles.callMetaValue}>{currentCall.dateLabel}</Text>
                                    </View>
                                    <View style={styles.callMetaDivider} />
                                    <View style={styles.callMetaItem}>
                                        <Text style={styles.callMetaLabel}>DURAÇÃO</Text>
                                        <Text style={styles.callMetaValue}>{currentCall.duration}</Text>
                                    </View>
                                    <View style={styles.callMetaDivider} />
                                    <View style={styles.callMetaItem}>
                                        <Text style={styles.callMetaLabel}>VOCÊ RECEBE</Text>
                                        <Text style={styles.callMetaEarnings}>
                                            {formatCurrency(currentCall.expectedEarnings)}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.detailsSectionTitle}>Serviços contratados</Text>
                                <View style={styles.contractedServices}>
                                    {currentCall.services.map((service) => (
                                        <View key={service} style={styles.contractedServiceChip}>
                                            <SymbolView
                                                name={{ ios: "checkmark", android: "check", web: "check" }}
                                                size={13}
                                                tintColor={COLORS.plum}
                                            />
                                            <Text style={styles.contractedServiceText}>{service}</Text>
                                        </View>
                                    ))}
                                </View>

                                <Text style={styles.detailsSectionTitle}>Ficha técnica da pessoa cuidada</Text>
                                <View style={styles.technicalSheet}>
                                    <TechnicalField
                                        highlight={Boolean(currentCall.allergies)}
                                        label="Alergias"
                                        value={currentCall.allergies ?? "Não informado"}
                                    />
                                    <TechnicalField
                                        label="Condições de saúde"
                                        value={currentCall.healthConditions ?? "Não informado"}
                                    />
                                    <TechnicalField
                                        label="Mobilidade"
                                        value={currentCall.mobility ?? "Não informado"}
                                    />
                                    <TechnicalField
                                        label="Restrições e necessidades"
                                        value={currentCall.restrictions ?? "Não informado"}
                                    />
                                    <TechnicalField
                                        label="Sexo"
                                        value={currentCall.sex ?? "Não informado"}
                                    />
                                </View>

                                <View style={styles.addressDetailCard}>
                                    <SymbolView
                                        name={{ ios: "location.fill", android: "location_on", web: "location_on" }}
                                        size={19}
                                        tintColor={COLORS.plum}
                                    />
                                    <View style={styles.addressDetailCopy}>
                                        <Text style={styles.addressDetailLabel}>ENDEREÇO DO ATENDIMENTO</Text>
                                        <Text style={styles.addressDetailText}>{currentCall.address}</Text>
                                    </View>
                                </View>
                            </ScrollView>

                            {acceptCallError ? <Text style={styles.acceptCallError}>{acceptCallError}</Text> : null}

                            {currentCall.status === "PENDENTE" ? (
                                <Pressable
                                    accessibilityRole="button"
                                    disabled={isAcceptingCall}
                                    onPress={acceptCall}
                                    style={({ pressed }) => [
                                        styles.acceptCallButton,
                                        isAcceptingCall && styles.acceptCallButtonDisabled,
                                        pressed && styles.detailsButtonPressed,
                                    ]}
                                >
                                    {isAcceptingCall ? (
                                        <ActivityIndicator color={COLORS.surface} size="small" />
                                    ) : (
                                        <Text style={styles.acceptCallButtonText}>Aceitar chamado</Text>
                                    )}
                                </Pressable>
                            ) : (
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={closeCallDetailsModal}
                                    style={({ pressed }) => [styles.closeDetailsButton, pressed && styles.detailsButtonPressed]}
                                >
                                    <Text style={styles.closeDetailsButtonText}>Fechar detalhes</Text>
                                </Pressable>
                            )}
                        </View>
                    ) : null}
                </View>
            </Modal>

        </SafeAreaView>
    );
}

function TechnicalField({ highlight = false, label, value }: { highlight?: boolean; label: string; value: string }) {
    return (
        <View style={styles.technicalField}>
            <View style={[styles.technicalMarker, highlight && styles.technicalMarkerHighlight]} />
            <View style={styles.technicalFieldCopy}>
                <Text style={styles.technicalFieldLabel}>{label}</Text>
                <Text style={[styles.technicalFieldValue, highlight && styles.technicalFieldValueHighlight]}>
                    {value}
                </Text>
            </View>
        </View>
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
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
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
    availabilityCard: { minHeight: 76, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, ...SHADOW },
    availabilityCardOnline: { borderColor: "#D7E1B8", backgroundColor: COLORS.greenSoft },
    availabilityCardOffline: { borderColor: "#E9CACA", backgroundColor: "#F8ECEC" },
    availabilityCardOnWay: { borderColor: "#DDC8D9", backgroundColor: COLORS.plumSoft },
    availabilityCardAttending: { borderColor: "#EED8A6", backgroundColor: "#FFF3DA" },
    availabilityCopy: { flex: 1, minWidth: 0 },
    availabilityTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    availabilityDot: { width: 8, height: 8, borderRadius: 4 },
    availabilityDotOnline: { backgroundColor: COLORS.green },
    availabilityDotOffline: { backgroundColor: "#B85E61" },
    availabilityDotOnWay: { backgroundColor: COLORS.plum },
    availabilityDotAttending: { backgroundColor: "#D18B24" },
    availabilityTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    availabilityTitleOffline: { color: "#8F4A4D" },
    availabilityTitleOnWay: { color: COLORS.plum },
    availabilityTitleAttending: { color: "#875A18" },
    availabilitySubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginLeft: 16, marginTop: 3 },
    busyStatusIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, marginLeft: 12 },
    busyStatusIconOnWay: { backgroundColor: COLORS.surface },
    busyStatusIconAttending: { backgroundColor: "#FFF9EC" },
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
    onWayCard: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#D9C9D6", backgroundColor: COLORS.surface, padding: 16, ...SHADOW },
    onWayHeader: { flexDirection: "row", alignItems: "center" },
    onWayIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: COLORS.plum },
    onWayHeaderCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
    onWayEyebrow: { color: COLORS.green, fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
    onWayTitle: { color: COLORS.text, fontSize: 17, lineHeight: 22, fontWeight: "900", marginTop: 2 },
    onWayRequester: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
    onWayStatusPill: { alignSelf: "flex-start", borderRadius: 9, backgroundColor: COLORS.greenSoft, paddingHorizontal: 9, paddingVertical: 6 },
    onWayStatusText: { color: COLORS.green, fontSize: 9, fontWeight: "900" },
    onWayAddressRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 13, backgroundColor: COLORS.background, marginTop: 14, paddingHorizontal: 12, paddingVertical: 11 },
    onWayAddress: { flex: 1, color: COLORS.muted, fontSize: 10, lineHeight: 15 },
    startCodeSection: { alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 13, paddingHorizontal: 14, paddingVertical: 15 },
    startCodeTitle: { color: COLORS.text, fontSize: 14, fontWeight: "900" },
    startCodeDescription: { maxWidth: 290, color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 4 },
    startCodeRow: { width: "100%", flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 13 },
    startCodeInput: { width: 48, height: 54, borderRadius: 13, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background, color: COLORS.plum, fontSize: 23, fontWeight: "900", textAlign: "center", padding: 0 },
    startCodeInputFilled: { borderColor: COLORS.plum, backgroundColor: COLORS.plumSoft },
    startAttendanceError: { color: "#B85E61", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 9 },
    startAttendanceButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.green, marginTop: 14 },
    startAttendanceButtonDisabled: { opacity: 0.42 },
    startAttendanceButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: "900" },
    openMapButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, borderWidth: 1, borderColor: COLORS.plum, marginTop: 9 },
    openMapButtonText: { color: COLORS.plum, fontSize: 13, fontWeight: "800" },
    onWayCancelButton: { minHeight: 35, alignItems: "center", justifyContent: "center", marginTop: 4 },
    requestCardWrapper: { position: "relative" },
    requestPulseBorder: { position: "absolute", left: -2, right: -2, top: -2, bottom: -2, borderRadius: 18, borderWidth: 2, borderColor: COLORS.plum },
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
    awaitingPill: { backgroundColor: COLORS.plumSoft },
    awaitingPillText: { color: COLORS.plum },
    divider: { height: 1, backgroundColor: COLORS.border, marginTop: 14, marginBottom: 14 },
    scheduleRow: { flexDirection: "row", alignItems: "center", gap: 20 },
    scheduleItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    scheduleText: { color: COLORS.text, fontSize: 11 },
    careDescription: { color: COLORS.text, fontSize: 11, lineHeight: 16, marginTop: 14 },
    requestAddress: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
    detailsButton: { height: 48, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.plum, borderRadius: 12, marginTop: 14 },
    detailsButtonPressed: { opacity: 0.86 },
    detailsButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: "800" },
    awaitingChoiceCard: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 13, borderWidth: 1, borderColor: "#DDC8D9", backgroundColor: COLORS.plumSoft, marginTop: 14, paddingHorizontal: 12, paddingVertical: 11 },
    awaitingChoiceIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: COLORS.surface },
    awaitingChoiceCopy: { flex: 1, minWidth: 0 },
    awaitingChoiceTitle: { color: COLORS.plum, fontSize: 12, lineHeight: 16, fontWeight: "800" },
    awaitingChoiceDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
    cancelAttendanceButton: { minHeight: 38, alignItems: "center", justifyContent: "center", marginTop: 3 },
    cancelAttendanceText: { color: "#B85E61", fontSize: 11, fontWeight: "800", textDecorationLine: "underline" },
    emptyCallCard: { minHeight: 150, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, ...SHADOW },
    emptyCallTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 10 },
    emptyCallDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: "center" },
    nextAppointmentCard: { minHeight: 112, justifyContent: "center", backgroundColor: COLORS.plumSoft, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 14, paddingHorizontal: 16, paddingVertical: 14, ...SHADOW },
    nextAppointmentEyebrow: { color: COLORS.plum, fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
    nextAppointmentTitle: { color: COLORS.text, fontSize: 15, lineHeight: 20, fontWeight: "800", marginTop: 10 },
    nextAppointmentDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
    callDetailsOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(46, 41, 44, 0.62)", paddingHorizontal: 16, paddingVertical: 30 },
    callDetailsCard: { width: "100%", maxWidth: 430, maxHeight: "92%", overflow: "hidden", borderRadius: 24, backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, elevation: 12, shadowColor: COLORS.text, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.22, shadowRadius: 15 },
    callDetailsHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    callDetailsHeaderCopy: { flex: 1 },
    callDetailsEyebrow: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
    callDetailsTitle: { color: COLORS.text, fontSize: 21, lineHeight: 28, fontWeight: "800", marginTop: 3 },
    callDetailsClose: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: COLORS.background },
    callDetailsContent: { paddingTop: 17, paddingBottom: 16 },
    patientSummary: { flexDirection: "row", alignItems: "center", borderRadius: 17, backgroundColor: COLORS.plumSoft, padding: 13 },
    patientSummaryAvatar: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: COLORS.plum },
    patientSummaryInitials: { color: COLORS.surface, fontSize: 17, fontWeight: "900" },
    patientSummaryCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
    patientSummaryName: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
    patientSummaryMeta: { color: COLORS.plum, fontSize: 11, fontWeight: "700", marginTop: 3 },
    patientSummaryRequester: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
    callMetaRow: { minHeight: 62, flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, marginTop: 11, paddingHorizontal: 13 },
    callMetaItem: { flex: 1 },
    callMetaLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
    callMetaValue: { color: COLORS.text, fontSize: 11, fontWeight: "800", marginTop: 4 },
    callMetaEarnings: { color: COLORS.green, fontSize: 11, fontWeight: "900", marginTop: 4 },
    callMetaDivider: { width: 1, height: 34, backgroundColor: COLORS.border, marginHorizontal: 8 },
    detailsSectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", marginTop: 20 },
    contractedServices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    contractedServiceChip: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, backgroundColor: COLORS.plumSoft, paddingHorizontal: 10, paddingVertical: 8 },
    contractedServiceText: { flexShrink: 1, color: COLORS.plum, fontSize: 10, lineHeight: 14, fontWeight: "700" },
    technicalSheet: { overflow: "hidden", borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, marginTop: 10 },
    technicalField: { minHeight: 58, flexDirection: "row", alignItems: "flex-start", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 11 },
    technicalMarker: { width: 4, height: 34, borderRadius: 2, backgroundColor: COLORS.green, marginRight: 10 },
    technicalMarkerHighlight: { backgroundColor: "#B85E61" },
    technicalFieldCopy: { flex: 1, minWidth: 0 },
    technicalFieldLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.25 },
    technicalFieldValue: { color: COLORS.text, fontSize: 12, lineHeight: 17, marginTop: 3 },
    technicalFieldValueHighlight: { color: "#9E484D", fontWeight: "700" },
    addressDetailCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, backgroundColor: COLORS.background, marginTop: 14, padding: 12 },
    addressDetailCopy: { flex: 1, minWidth: 0 },
    addressDetailLabel: { color: COLORS.plum, fontSize: 8, fontWeight: "900", letterSpacing: 0.45 },
    addressDetailText: { color: COLORS.text, fontSize: 11, lineHeight: 16, marginTop: 4 },
    closeDetailsButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.plum },
    closeDetailsButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: "800" },
    acceptCallError: { color: "#B85E61", fontSize: 11, lineHeight: 16, textAlign: "center", marginBottom: 10 },
    acceptCallButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.green },
    acceptCallButtonDisabled: { opacity: 0.65 },
    acceptCallButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: "900" },
    startConfirmOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(46, 41, 44, 0.62)", padding: 20 },
    startConfirmCard: { width: "100%", maxWidth: 380, alignItems: "center", borderRadius: 22, backgroundColor: COLORS.surface, padding: 22, ...SHADOW },
    startConfirmIcon: { width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: COLORS.greenSoft },
    startConfirmTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900", textAlign: "center", marginTop: 14 },
    startConfirmDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7 },
    startConfirmActions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 20 },
    startConfirmBackButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    startConfirmBackText: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
    startConfirmButton: { flex: 1.4, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: COLORS.green },
    startConfirmButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: "900" },
    ongoingCard: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#D7E1B8", backgroundColor: COLORS.surface, padding: 17, ...SHADOW },
    ongoingHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    ongoingHeaderCopy: { flex: 1, minWidth: 0, paddingRight: 10 },
    ongoingEyebrow: { color: COLORS.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
    ongoingTitle: { color: COLORS.text, fontSize: 22, fontWeight: "900", marginTop: 4 },
    ongoingPatientInfo: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
    ongoingLivePill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 9, backgroundColor: COLORS.greenSoft, paddingHorizontal: 8, paddingVertical: 6 },
    ongoingLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
    ongoingLiveText: { color: COLORS.green, fontSize: 8, fontWeight: "900" },
    timerCard: { alignItems: "center", borderRadius: 18, backgroundColor: COLORS.plumSoft, marginTop: 18, paddingVertical: 18 },
    timerLabel: { color: COLORS.plum, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
    timerValue: { color: COLORS.plum, fontSize: 34, fontWeight: "900", letterSpacing: 2, marginTop: 5 },
    timerEnd: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
    ongoingSummaryRow: { minHeight: 68, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginTop: 12, paddingHorizontal: 13 },
    ongoingSummaryItem: { flex: 1 },
    ongoingSummaryLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "900" },
    ongoingSummaryValue: { color: COLORS.text, fontSize: 11, fontWeight: "800", marginTop: 4 },
    recordButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, backgroundColor: COLORS.plum, marginTop: 14 },
    recordButtonText: { color: COLORS.surface, fontSize: 14, fontWeight: "900" },
    ongoingCancelButton: { minHeight: 36, alignItems: "center", justifyContent: "center", marginTop: 4 },
    pressed: { opacity: 0.65 },
});
