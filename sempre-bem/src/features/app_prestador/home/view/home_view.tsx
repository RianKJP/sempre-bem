import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

function formatHourlyRateInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 7);
    if (!digits) return "";

    return (Number(digits) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function parseHourlyRate(value: string) {
    return Number(value.replace(/\./g, "").replace(",", "."));
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        minimumFractionDigits: 2,
        style: "currency",
    }).format(value);
}

export default function HomeView() {
    const {
        acceptCallError,
        acceptCurrentCall,
        changeProfile,
        clearAcceptCallError,
        currentCall,
        isAvailable,
        isAcceptingCall,
        isLoadingProvider,
        isUpdatingAvailability,
        isUpdatingHourlyRate,
        prestador,
        providerError,
        reloadProvider,
        toggleAvailability,
        updateHourlyRate,
    } = useHomeViewModel();
    const [hourlyRateModalVisible, setHourlyRateModalVisible] = useState(false);
    const [callDetailsModalVisible, setCallDetailsModalVisible] = useState(false);
    const [hourlyRateInput, setHourlyRateInput] = useState("");
    const [hourlyRateError, setHourlyRateError] = useState<string>();
    const requestPulse = useRef(new Animated.Value(0)).current;
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
    const hourlyRateLabel = prestador?.valor_hora && prestador.valor_hora > 0
        ? new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(prestador.valor_hora)
        : "Não definido";

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

    function openHourlyRateModal() {
        setHourlyRateInput(
            prestador?.valor_hora
                ? formatHourlyRateInput(String(Math.round(prestador.valor_hora * 100)))
                : "",
        );
        setHourlyRateError(undefined);
        setHourlyRateModalVisible(true);
    }

    function closeHourlyRateModal() {
        if (isUpdatingHourlyRate) return;
        setHourlyRateModalVisible(false);
        setHourlyRateError(undefined);
    }

    async function saveHourlyRate() {
        const value = parseHourlyRate(hourlyRateInput);
        if (!Number.isFinite(value) || value < 1 || value > 99_999.99) {
            setHourlyRateError("Informe um valor entre R$ 1,00 e R$ 99.999,99.");
            return;
        }

        setHourlyRateError(undefined);
        try {
            await updateHourlyRate(value);
            setHourlyRateModalVisible(false);
        } catch {
            setHourlyRateError("Não foi possível salvar o valor da hora.");
        }
    }

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

                <Pressable
                    accessibilityRole="button"
                    onPress={openHourlyRateModal}
                    style={({ pressed }) => [styles.hourlyRateButton, pressed && styles.pressed]}
                >
                    <View style={styles.debugBadge}><Text style={styles.debugBadgeText}>DEBUG</Text></View>
                    <View style={styles.hourlyRateCopy}>
                        <Text style={styles.hourlyRateTitle}>Valor da hora de trabalho</Text>
                        <Text style={styles.hourlyRateDescription}>Temporariamente configurado pela Home</Text>
                    </View>
                    <Text style={styles.hourlyRateValue}>{hourlyRateLabel}</Text>
                    <SymbolView name={{ ios: "pencil", android: "edit", web: "edit" }} size={18} tintColor={COLORS.plum} />
                </Pressable>

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
                        onPress={openCallDetailsModal}
                        style={({ pressed }) => [styles.detailsButton, pressed && styles.detailsButtonPressed]}
                    >
                        <Text style={styles.detailsButtonText}>
                            {isAttending ? "Ver detalhes do atendimento" : "Ver detalhes"}
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

            <Modal
                animationType="fade"
                onRequestClose={closeHourlyRateModal}
                statusBarTranslucent
                transparent
                visible={hourlyRateModalVisible}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.rateModalOverlay}
                >
                    <Pressable
                        accessibilityLabel="Fechar edição do valor da hora"
                        disabled={isUpdatingHourlyRate}
                        onPress={closeHourlyRateModal}
                        style={StyleSheet.absoluteFill}
                    />
                    <View accessibilityViewIsModal style={styles.rateModalCard}>
                        <View style={styles.rateModalIcon}>
                            <SymbolView name={{ ios: "banknote", android: "payments", web: "payments" }} size={27} tintColor={COLORS.plum} />
                        </View>
                        <Text style={styles.rateModalTitle}>Valor da sua hora</Text>
                        <Text style={styles.rateModalDescription}>
                            Esse valor será exibido para os clientes enquanto você estiver online.
                        </Text>

                        <Text style={styles.rateInputLabel}>Valor por hora</Text>
                        <View style={[styles.rateInputContainer, hourlyRateError && styles.rateInputInvalid]}>
                            <Text style={styles.rateInputPrefix}>R$</Text>
                            <TextInput
                                accessibilityLabel="Valor por hora"
                                autoFocus
                                editable={!isUpdatingHourlyRate}
                                keyboardType="numeric"
                                onChangeText={(value) => {
                                    setHourlyRateInput(formatHourlyRateInput(value));
                                    setHourlyRateError(undefined);
                                }}
                                placeholder="0,00"
                                placeholderTextColor="#AAA2A5"
                                selectTextOnFocus
                                style={styles.rateInput}
                                value={hourlyRateInput}
                            />
                        </View>
                        {hourlyRateError ? <Text accessibilityRole="alert" style={styles.rateError}>{hourlyRateError}</Text> : null}

                        <View style={styles.rateModalActions}>
                            <Pressable disabled={isUpdatingHourlyRate} onPress={closeHourlyRateModal} style={styles.rateCancelButton}>
                                <Text style={styles.rateCancelText}>Cancelar</Text>
                            </Pressable>
                            <Pressable disabled={isUpdatingHourlyRate} onPress={saveHourlyRate} style={styles.rateSaveButton}>
                                {isUpdatingHourlyRate
                                    ? <ActivityIndicator color={COLORS.surface} size="small" />
                                    : <Text style={styles.rateSaveText}>Salvar valor</Text>}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    availabilityCard: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.greenSoft, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, ...SHADOW },
    availabilityCopy: { flex: 1, minWidth: 0 },
    availabilityTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green },
    availabilityTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "800" },
    availabilitySubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginLeft: 16, marginTop: 3 },
    hourlyRateButton: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.plum, backgroundColor: COLORS.plumSoft },
    debugBadge: { borderRadius: 6, backgroundColor: COLORS.plum, paddingHorizontal: 6, paddingVertical: 4 },
    debugBadgeText: { color: COLORS.surface, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
    hourlyRateCopy: { flex: 1, minWidth: 0 },
    hourlyRateTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
    hourlyRateDescription: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 2 },
    hourlyRateValue: { color: COLORS.plum, fontSize: 13, fontWeight: "800" },
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
    rateModalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(46, 41, 44, 0.58)", padding: 20 },
    rateModalCard: { width: "100%", maxWidth: 380, borderRadius: 22, backgroundColor: COLORS.surface, padding: 22, ...SHADOW },
    rateModalIcon: { width: 56, height: 56, alignItems: "center", justifyContent: "center", alignSelf: "center", borderRadius: 28, backgroundColor: COLORS.plumSoft },
    rateModalTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "800", marginTop: 14, textAlign: "center" },
    rateModalDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: "center" },
    rateInputLabel: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 22, marginBottom: 8 },
    rateInputContainer: { minHeight: 54, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, paddingHorizontal: 14 },
    rateInputInvalid: { borderColor: "#B85E61" },
    rateInputPrefix: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginRight: 8 },
    rateInput: { flex: 1, color: COLORS.text, fontSize: 20, fontWeight: "800", paddingVertical: 10 },
    rateError: { color: "#B85E61", fontSize: 11, lineHeight: 16, marginTop: 7 },
    rateModalActions: { flexDirection: "row", gap: 10, marginTop: 22 },
    rateCancelButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    rateCancelText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
    rateSaveButton: { flex: 1.25, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: COLORS.plum },
    rateSaveText: { color: COLORS.surface, fontSize: 13, fontWeight: "800" },
    pressed: { opacity: 0.65 },
});
