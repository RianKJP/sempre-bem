import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    useWindowDimensions,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RequestMap } from "@/features/app_cliente/solicitacao/components/request_map";
import type { PrestadorAceiteApi } from "@/features/app_cliente/solicitacao/service/api_solicitacao";
import {
    CAREGIVER_SERVICES,
    DURATION_OPTIONS,
    NURSE_SERVICES,
    type CareService,
} from "@/features/app_cliente/solicitacao/service/solicitacao_service";
import { useSolicitacaoViewModel } from "@/features/app_cliente/solicitacao/viewmodels/use_solicitacao_view_model";

// Paleta exclusiva da solicitação, alinhada visualmente à home do cliente.
const COLORS = {
    background: "#F8F5EE",
    border: "#E5DED5",
    borderMuted: "#D7CFC5",
    borderStrong: "#C5BBB0",
    disabled: "#E2DDD6",
    danger: "#B64E55",
    dangerSoft: "#FAECEC",
    handle: "#C8C0B7",
    mapBackground: "#E8E4DC",
    primary: "#713568",
    primaryBorderSoft: "#D8BFD3",
    primarySoft: "#F7EDF5",
    secondary: "#94AA32",
    secondarySoft: "#EFF4DD",
    surface: "#FFFFFF",
    surfaceDisabled: "#F0ECE6",
    surfaceSubtle: "#F5F1EB",
    text: "#262326",
    textMuted: "#766F73",
    terciaria: "#262326",
    white: "#FFFFFF",
} as const;

export default function SolicitacaoView() {
    const insets = useSafeAreaInsets();
    const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
    const {
        addCustomService,
        acceptedProviders,
        address,
        addressHelperText,
        careRecipients,
        careRecipientsError,
        cancelActiveRequest,
        cancelError,
        cancelSearch,
        changeAddress,
        changeCustomDuration,
        changeCustomService,
        confirmCustomDuration,
        coordinate,
        customDuration,
        customDurationError,
        customService,
        customServiceError,
        customServices,
        duration,
        familiar,
        goBack,
        hasCurrentLocation,
        isCancelling,
        isCustomDurationVisible,
        isCustomServiceVisible,
        isLoadingCareRecipients,
        isSearching,
        isSubmitting,
        clearCancelError,
        openCustomDuration,
        openCustomService,
        paymentMethod,
        recommendation,
        reloadCareRecipients,
        returnToClientHomeForDebug,
        removeCustomService,
        selectDuration,
        selectCareRecipient,
        selectedElderId,
        selectPaymentMethod,
        selectedServiceIds,
        submitRequest,
        submitError,
        startSearch,
        toggleService,
    } = useSolicitacaoViewModel();

    const isCustomDuration = !DURATION_OPTIONS.some((option) => option === duration);
    const canSubmit = Boolean(
        address.trim() &&
        recommendation &&
        selectedElderId &&
        paymentMethod &&
        !isSubmitting,
    );
    const offscreenDistance = viewportHeight + 80;
    const isCompactHeight = viewportHeight < 700;
    const isCompactWidth = viewportWidth < 360;
    const usesTwoDurationColumns = viewportWidth < 340;
    const formSheetTranslateY = useRef(new Animated.Value(0)).current;
    const searchSheetTranslateY = useRef(new Animated.Value(offscreenDistance)).current;
    const [isCancelPopupVisible, setIsCancelPopupVisible] = useState(false);
    const [selectionPopup, setSelectionPopup] = useState<"careRecipient" | "payment">();
    const [searchTopBarHeight, setSearchTopBarHeight] = useState(58);
    const searchedProfessional = recommendation === "Enfermeiro" ? "enfermeiros" : "cuidadores";
    const paymentLabel = paymentMethod === "PIX"
        ? "Pix"
        : paymentMethod === "DINHEIRO"
            ? "Dinheiro"
            : "Selecionar forma de pagamento";
    const visibleAcceptedProviders = [...acceptedProviders]
        .sort((first, second) => Date.parse(second.aceito_em) - Date.parse(first.aceito_em))
        .slice(0, isCompactHeight ? 2 : 3);
    const acceptedCardHeight = 78;
    const mapControlsTopOffset = isSearching
        ? insets.top + 12 + searchTopBarHeight + 14
        : 12;

    useEffect(() => {
        if (!isSearching) {
            formSheetTranslateY.setValue(0);
            searchSheetTranslateY.setValue(offscreenDistance);
            return;
        }

        searchSheetTranslateY.setValue(offscreenDistance);
        Animated.spring(searchSheetTranslateY, {
            damping: 20,
            mass: 0.9,
            stiffness: 180,
            toValue: 0,
            useNativeDriver: true,
        }).start();
    }, [formSheetTranslateY, isSearching, offscreenDistance, searchSheetTranslateY]);

    const startSearching = async () => {
        const requestWasCreated = await submitRequest();

        if (!requestWasCreated) {
            return;
        }

        Animated.timing(formSheetTranslateY, {
            duration: 280,
            toValue: offscreenDistance,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                startSearch();
            }
        });
    };

    const returnToRequest = () => {
        Animated.timing(searchSheetTranslateY, {
            duration: 240,
            toValue: offscreenDistance,
            useNativeDriver: true,
        }).start(() => {
            cancelSearch();
        });
    };

    const openCancelPopup = () => {
        clearCancelError();
        setIsCancelPopupVisible(true);
    };

    const closeCancelPopup = () => {
        if (isCancelling) {
            return;
        }

        clearCancelError();
        setIsCancelPopupVisible(false);
    };

    const confirmCancellation = async () => {
        const requestWasCancelled = await cancelActiveRequest();

        if (!requestWasCancelled) {
            return;
        }

        setIsCancelPopupVisible(false);
        returnToRequest();
    };

    useEffect(() => {
        if (!isSearching) {
            return;
        }

        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            openCancelPopup();
            return true;
        });

        return () => subscription.remove();
    }, [isSearching]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.container}
        >
            <StatusBar style="dark" />

            <View style={[styles.mapArea, isSearching && styles.mapAreaSearching]}>
                <RequestMap
                    controlsTopOffset={mapControlsTopOffset}
                    hasCurrentLocation={hasCurrentLocation}
                    latitude={coordinate.latitude}
                    longitude={coordinate.longitude}
                />
            </View>

            {!isSearching ? (
            <Animated.View
                style={[
                    styles.sheet,
                    { transform: [{ translateY: formSheetTranslateY }] },
                ]}
            >
                <View style={styles.sheetTopSpacer}>
                    <View style={styles.handle} />
                </View>
                <ScrollView
                    bounces={false}
                    contentContainerStyle={[
                        styles.content,
                        isCompactWidth && styles.contentCompact,
                        { paddingBottom: 20 },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    overScrollMode="never"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Pressable
                            accessibilityLabel="Voltar"
                            hitSlop={10}
                            onPress={goBack}
                            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                                size={25}
                                tintColor={COLORS.text}
                            />
                        </Pressable>
                        <View style={styles.headerCopy}>
                            <Text style={styles.title}>Faça sua solicitação</Text>
                            <Text style={styles.subtitle}>Conte o que você precisa e indicaremos o melhor cuidado.</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Para quem é o atendimento?</Text>
                        <Text style={styles.sectionDescription}>Escolha uma das pessoas cuidadas cadastradas.</Text>
                        <SelectionField
                            description={selectedElderId ? "Pessoa selecionada para este chamado" : "A seleção é obrigatória"}
                            kind="person"
                            label={familiar || "Selecionar pessoa cuidada"}
                            loading={isLoadingCareRecipients}
                            onPress={() => setSelectionPopup("careRecipient")}
                            selected={Boolean(selectedElderId)}
                        />
                        {careRecipientsError ? (
                            <View style={styles.selectionErrorRow}>
                                <Text style={styles.selectionError}>{careRecipientsError}</Text>
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={reloadCareRecipients}
                                    style={({ pressed }) => pressed && styles.pressed}
                                >
                                    <Text style={styles.selectionRetry}>Tentar novamente</Text>
                                </Pressable>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.section}>
                        <FormField
                            autoCapitalize="words"
                            helperText={addressHelperText}
                            label="Endereço do atendimento"
                            onChangeText={changeAddress}
                            placeholder="Rua, número e bairro"
                            value={address}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Por quantas horas você precisa de cuidado?</Text>
                        <Text style={styles.sectionDescription}>Escolha uma opção ou informe outra duração.</Text>

                        <View style={styles.durationGrid}>
                            {DURATION_OPTIONS.map((hours) => {
                                const selected = duration === hours;

                                return (
                                    <Pressable
                                        accessibilityRole="button"
                                        key={hours}
                                        onPress={() => selectDuration(hours)}
                                        style={({ pressed }) => [
                                            styles.durationButton,
                                            usesTwoDurationColumns && styles.durationButtonTwoColumns,
                                            selected && styles.optionSelected,
                                            pressed && styles.pressed,
                                        ]}
                                    >
                                        <Text style={[styles.durationText, selected && styles.optionTextSelected]}>
                                            {hours} horas
                                        </Text>
                                    </Pressable>
                                );
                            })}

                            <Pressable
                                accessibilityLabel="Informar outra quantidade de horas"
                                accessibilityRole="button"
                                onPress={openCustomDuration}
                                style={({ pressed }) => [
                                    styles.durationButton,
                                    usesTwoDurationColumns && styles.durationButtonTwoColumns,
                                    styles.addDurationButton,
                                    isCustomDuration && styles.optionSelected,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <SymbolView
                                    name={{ ios: "plus", android: "add", web: "add" }}
                                    size={23}
                                    tintColor={isCustomDuration ? COLORS.white : COLORS.primary}
                                />
                                {isCustomDuration ? (
                                    <Text style={styles.customDurationSelected}>{duration}h</Text>
                                ) : null}
                            </Pressable>
                        </View>

                        {isCustomDurationVisible ? (
                            <View style={styles.inlineEditor}>
                                <FormField
                                    autoFocus
                                    containerStyle={styles.inlineInput}
                                    error={customDurationError}
                                    keyboardType="number-pad"
                                    label="Quantidade personalizada"
                                    maxLength={2}
                                    onChangeText={changeCustomDuration}
                                    onSubmitEditing={confirmCustomDuration}
                                    placeholder="Ex: 10"
                                    returnKeyType="done"
                                    value={customDuration}
                                />
                                <Pressable
                                    accessibilityLabel="Confirmar quantidade de horas"
                                    onPress={confirmCustomDuration}
                                    style={({ pressed }) => [styles.confirmInlineButton, pressed && styles.pressed]}
                                >
                                    <SymbolView
                                        name={{ ios: "checkmark", android: "check", web: "check" }}
                                        size={22}
                                        tintColor={COLORS.white}
                                    />
                                </Pressable>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quais serviços são necessários?</Text>
                        <Text style={styles.sectionDescription}>Você pode selecionar mais de uma opção.</Text>

                        <ServiceGroup
                            description="Apoio na rotina e nas atividades do dia a dia"
                            onToggle={toggleService}
                            selectedIds={selectedServiceIds}
                            services={CAREGIVER_SERVICES}
                            title="Cuidados do dia a dia"
                        />

                        <ServiceGroup
                            description="Procedimentos e acompanhamento clínico"
                            onToggle={toggleService}
                            selectedIds={selectedServiceIds}
                            services={NURSE_SERVICES}
                            title="Cuidados de enfermagem"
                        />

                        {customServices.length ? (
                            <View style={styles.customServicesArea}>
                                <Text style={styles.serviceGroupTitle}>Serviços adicionais</Text>
                                <View style={styles.chipWrap}>
                                    {customServices.map((service) => (
                                        <Pressable
                                            accessibilityLabel={`Remover ${service}`}
                                            key={service}
                                            onPress={() => removeCustomService(service)}
                                            style={styles.customServiceChip}
                                        >
                                            <Text style={styles.customServiceText}>{service}</Text>
                                            <SymbolView
                                                name={{ ios: "xmark", android: "close", web: "close" }}
                                                size={14}
                                                tintColor={COLORS.primary}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ) : null}

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCustomService}
                            style={({ pressed }) => [styles.addServiceButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "plus", android: "add", web: "add" }}
                                size={19}
                                tintColor={COLORS.white}
                            />
                            <Text style={styles.addServiceText}>Adicionar outro serviço</Text>
                        </Pressable>

                        {isCustomServiceVisible ? (
                            <View style={styles.inlineEditor}>
                                <FormField
                                    autoFocus
                                    containerStyle={styles.inlineInput}
                                    error={customServiceError}
                                    label="Serviço adicional"
                                    onChangeText={changeCustomService}
                                    onSubmitEditing={addCustomService}
                                    placeholder="Ex: Acompanhamento em consulta"
                                    returnKeyType="done"
                                    value={customService}
                                />
                                <Pressable
                                    accessibilityLabel="Adicionar serviço"
                                    onPress={addCustomService}
                                    style={({ pressed }) => [styles.confirmInlineButton, pressed && styles.pressed]}
                                >
                                    <SymbolView
                                        name={{ ios: "checkmark", android: "check", web: "check" }}
                                        size={22}
                                        tintColor={COLORS.white}
                                    />
                                </Pressable>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Forma de pagamento</Text>
                        <Text style={styles.sectionDescription}>Defina como o atendimento será pago ao profissional.</Text>
                        <SelectionField
                            description={paymentMethod ? "Forma de pagamento selecionada" : "Escolha Pix ou dinheiro"}
                            kind="payment"
                            label={paymentLabel}
                            onPress={() => setSelectionPopup("payment")}
                            selected={Boolean(paymentMethod)}
                        />
                    </View>

                    <View style={[styles.recommendationCard, !recommendation && styles.recommendationCardEmpty]}>
                        <View style={[styles.recommendationIcon, !recommendation && styles.recommendationIconEmpty]}>
                            <SymbolView
                                name={recommendation === "Enfermeiro"
                                    ? { ios: "cross.case.fill", android: "medical_services", web: "medical_services" }
                                    : { ios: "person.fill", android: "person", web: "person" }}
                                size={24}
                                tintColor={recommendation ? COLORS.primary : COLORS.textMuted}
                            />
                        </View>
                        <View style={styles.recommendationCopy}>
                            <Text style={styles.recommendationEyebrow}>NOSSA RECOMENDAÇÃO</Text>
                            <Text style={styles.recommendationTitle}>
                                {recommendation ?? "Selecione um serviço"}
                            </Text>
                            <Text style={styles.recommendationDescription}>
                                {recommendation === "Enfermeiro"
                                    ? "Os cuidados selecionados incluem atendimento de enfermagem."
                                    : recommendation === "Cuidador"
                                        ? "Os cuidados selecionados estão relacionados ao apoio na rotina."
                                        : "Escolha uma opção das listas acima para vermos o perfil mais indicado."}
                            </Text>
                        </View>
                    </View>

                    <PrimaryButton
                        disabled={!canSubmit}
                        label={isSubmitting
                            ? "Criando solicitação..."
                            : "Buscar prestador"}
                        onPress={startSearching}
                        style={styles.submitButton}
                    />
                    {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
                </ScrollView>
            </Animated.View>
            ) : (
                <>
                    <View
                        onLayout={({ nativeEvent }) => {
                            const nextHeight = Math.ceil(nativeEvent.layout.height);

                            if (nextHeight !== searchTopBarHeight) {
                                setSearchTopBarHeight(nextHeight);
                            }
                        }}
                        style={[
                            styles.searchTopBar,
                            isCompactWidth && styles.searchTopBarCompact,
                            { top: insets.top + 12 },
                        ]}
                    >
                        <Pressable
                            accessibilityLabel="Voltar para a solicitação"
                            onPress={openCancelPopup}
                            style={({ pressed }) => [styles.searchBackButton, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
                                size={24}
                                tintColor={COLORS.text}
                            />
                        </Pressable>

                        <View style={styles.searchAddressCard}>
                            <SymbolView
                                name={{ ios: "location.fill", android: "location_on", web: "location_on" }}
                                size={19}
                                tintColor={COLORS.primary}
                            />
                            <View style={styles.searchAddressCopy}>
                                <Text style={styles.searchAddressLabel}>Buscando profissionais para</Text>
                                <Text numberOfLines={2} style={styles.searchAddressText}>
                                    {address.trim() || "Endereço do atendimento"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {visibleAcceptedProviders.length ? (
                        <View
                            pointerEvents="box-none"
                            style={[
                                styles.acceptedProvidersOverlay,
                                {
                                    height: visibleAcceptedProviders.length * acceptedCardHeight,
                                    top: Math.max(
                                        insets.top + searchTopBarHeight + 70,
                                        viewportHeight * 0.3,
                                    ),
                                },
                            ]}
                        >
                            {visibleAcceptedProviders.map((provider, index) => (
                                <AcceptedProviderCard
                                    duration={duration}
                                    index={index}
                                    key={provider.id_cuidador}
                                    provider={provider}
                                    viewportWidth={viewportWidth}
                                />
                            ))}
                            {acceptedProviders.length > visibleAcceptedProviders.length ? (
                                <Text
                                    style={[
                                        styles.moreAcceptedProviders,
                                        { top: visibleAcceptedProviders.length * acceptedCardHeight - 3 },
                                    ]}
                                >
                                    +{acceptedProviders.length - visibleAcceptedProviders.length} prestador(es) também aceitaram
                                </Text>
                            ) : null}
                        </View>
                    ) : null}

                    <Animated.View
                        style={[
                            styles.searchSheet,
                            isCompactWidth && styles.searchSheetCompactWidth,
                            isCompactHeight && styles.searchSheetCompactHeight,
                            {
                                paddingBottom: 20,
                                transform: [{ translateY: searchSheetTranslateY }],
                            },
                        ]}
                    >
                        <View style={styles.handle} />
                        <View style={[styles.searchingIcon, isCompactHeight && styles.searchingIconCompact]}>
                            <ActivityIndicator color={COLORS.white} size="large" />
                        </View>
                        <Text style={[styles.searchingTitle, isCompactHeight && styles.searchingTitleCompact]}>
                            Buscando {searchedProfessional}
                        </Text>
                        <Text style={styles.searchingDescription}>
                            Estamos enviando seu chamado aos profissionais próximos do endereço informado.
                        </Text>

                        <View style={[styles.searchSummary, isCompactHeight && styles.searchSummaryCompact]}>
                            <View style={styles.searchSummaryItem}>
                                <Text style={styles.searchSummaryLabel}>CUIDADO PARA</Text>
                                <Text numberOfLines={1} style={styles.searchSummaryValue}>{familiar}</Text>
                            </View>
                            <View style={styles.searchSummaryDivider} />
                            <View style={styles.searchSummaryItem}>
                                <Text style={styles.searchSummaryLabel}>DURAÇÃO</Text>
                                <Text style={styles.searchSummaryValue}>{duration} horas</Text>
                            </View>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            onPress={openCancelPopup}
                            style={({ pressed }) => [styles.cancelSearchButton, pressed && styles.pressed]}
                        >
                            <Text style={styles.cancelSearchText}>Cancelar busca</Text>
                        </Pressable>
                    </Animated.View>
                </>
            )}

            <ChoiceModal
                emptyMessage="Nenhuma pessoa cuidada foi cadastrada. Cadastre uma pessoa pelo Perfil antes de criar o chamado."
                onClose={() => setSelectionPopup(undefined)}
                onSelect={(value) => {
                    selectCareRecipient(value);
                    setSelectionPopup(undefined);
                }}
                options={careRecipients.map((person) => ({
                    description: person.relationship,
                    label: person.name,
                    value: person.id,
                }))}
                selectedValue={selectedElderId}
                title="Para quem é o atendimento?"
                visible={selectionPopup === "careRecipient"}
            />

            <ChoiceModal
                onClose={() => setSelectionPopup(undefined)}
                onSelect={(value) => {
                    selectPaymentMethod(value as "DINHEIRO" | "PIX");
                    setSelectionPopup(undefined);
                }}
                options={[
                    { description: "Pagamento instantâneo pelo aplicativo do banco", label: "Pix", value: "PIX" },
                    { description: "Pagamento presencial ao final do atendimento", label: "Dinheiro", value: "DINHEIRO" },
                ]}
                selectedValue={paymentMethod}
                title="Forma de pagamento"
                visible={selectionPopup === "payment"}
            />

            <Modal
                animationType="fade"
                onRequestClose={closeCancelPopup}
                statusBarTranslucent
                transparent
                visible={isCancelPopupVisible}
            >
                <View style={[styles.cancelPopupOverlay, isCompactWidth && styles.cancelPopupOverlayCompact]}>
                    <Pressable
                        accessibilityLabel="Fechar confirmação de cancelamento"
                        disabled={isCancelling}
                        onPress={closeCancelPopup}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        accessibilityViewIsModal
                        style={styles.cancelPopupCard}
                    >
                        <View style={styles.cancelPopupIcon}>
                            <SymbolView
                                name={{ ios: "exclamationmark", android: "warning", web: "warning" }}
                                size={27}
                                tintColor={COLORS.danger}
                            />
                        </View>
                        <Text style={styles.cancelPopupTitle}>Cancelar este chamado?</Text>
                        <Text style={styles.cancelPopupDescription}>
                            Ao confirmar, a busca por profissionais será encerrada e o chamado ficará como cancelado.
                        </Text>

                        {cancelError ? <Text style={styles.cancelPopupError}>{cancelError}</Text> : null}

                        <View style={styles.cancelPopupActions}>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isCancelling}
                                onPress={closeCancelPopup}
                                style={({ pressed }) => [
                                    styles.keepSearchingButton,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.keepSearchingText}>Continuar buscando</Text>
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isCancelling}
                                onPress={confirmCancellation}
                                style={({ pressed }) => [
                                    styles.confirmCancelButton,
                                    isCancelling && styles.primaryButtonDisabled,
                                    pressed && styles.pressed,
                                ]}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <Text style={styles.confirmCancelText}>Cancelar chamado</Text>
                                )}
                            </Pressable>
                            <Pressable
                                accessibilityRole="button"
                                disabled={isCancelling}
                                onPress={returnToClientHomeForDebug}
                                style={({ pressed }) => [
                                    styles.debugHomeButton,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.debugHomeText}>Voltar ao início sem cancelar (debug)</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

function AcceptedProviderCard({
    duration,
    index,
    provider,
    viewportWidth,
}: {
    duration: number;
    index: number;
    provider: PrestadorAceiteApi;
    viewportWidth: number;
}) {
    const translateX = useRef(new Animated.Value(viewportWidth + 40)).current;
    const translateY = useRef(new Animated.Value(index * 78)).current;
    const initials = provider.nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    const role = provider.tipo_profissional === "ENFERMEIRO" ? "Enfermeiro" : "Cuidador";

    useEffect(() => {
        Animated.spring(translateX, {
            damping: 18,
            mass: 0.85,
            stiffness: 150,
            toValue: 0,
            useNativeDriver: true,
        }).start();
    }, [translateX]);

    useEffect(() => {
        Animated.spring(translateY, {
            damping: 20,
            mass: 0.9,
            stiffness: 170,
            toValue: index * 78,
            useNativeDriver: true,
        }).start();
    }, [index, translateY]);

    return (
        <Animated.View
            style={[
                styles.acceptedProviderCard,
                { transform: [{ translateX }, { translateY }] },
            ]}
        >
            <View style={styles.acceptedProviderAvatar}>
                <Text style={styles.acceptedProviderInitials}>{initials}</Text>
            </View>
            <View style={styles.acceptedProviderCopy}>
                <Text style={styles.acceptedProviderEyebrow}>ACEITOU SEU CHAMADO</Text>
                <Text numberOfLines={1} style={styles.acceptedProviderName}>{provider.nome}</Text>
                <Text numberOfLines={1} style={styles.acceptedProviderMeta}>
                    {role} · {formatMoney(provider.valor_hora)}/hora
                </Text>
            </View>
            <View style={styles.acceptedProviderPrice}>
                <Text style={styles.acceptedProviderPriceLabel}>{duration}H</Text>
                <Text style={styles.acceptedProviderPriceValue}>{formatMoney(provider.valor_total)}</Text>
            </View>
        </Animated.View>
    );
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        minimumFractionDigits: 2,
        style: "currency",
    }).format(value);
}

type FormFieldProps = TextInputProps & {
    containerStyle?: StyleProp<ViewStyle>;
    error?: string;
    helperText?: string;
    label: string;
};

function FormField({
    containerStyle,
    error,
    helperText,
    label,
    multiline,
    style,
    ...inputProps
}: FormFieldProps) {
    return (
        <View style={containerStyle}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                multiline={multiline}
                placeholderTextColor={COLORS.textMuted}
                style={[
                    styles.fieldInput,
                    multiline && styles.fieldInputMultiline,
                    error && styles.fieldInputError,
                    style,
                ]}
                textAlignVertical={multiline ? "top" : "center"}
                {...inputProps}
            />
            {error || helperText ? (
                <Text style={[styles.fieldHelper, error && styles.fieldError]}>
                    {error ?? helperText}
                </Text>
            ) : null}
        </View>
    );
}

type PrimaryButtonProps = {
    disabled?: boolean;
    label: string;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
};

function PrimaryButton({ disabled = false, label, onPress, style }: PrimaryButtonProps) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.primaryButton,
                disabled && styles.primaryButtonDisabled,
                pressed && !disabled && styles.primaryButtonPressed,
                style,
            ]}
        >
            <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>
                {label}
            </Text>
        </Pressable>
    );
}

type SelectionFieldProps = {
    description: string;
    kind: "payment" | "person";
    label: string;
    loading?: boolean;
    onPress: () => void;
    selected: boolean;
};

function SelectionField({ description, kind, label, loading = false, onPress, selected }: SelectionFieldProps) {
    return (
        <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onPress}
            style={({ pressed }) => [
                styles.selectionField,
                selected && styles.selectionFieldSelected,
                pressed && styles.pressed,
            ]}
        >
            <View style={[styles.selectionFieldIcon, selected && styles.selectionFieldIconSelected]}>
                {loading ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                ) : (
                    <SymbolView
                        name={kind === "person"
                            ? { ios: "person.fill", android: "person", web: "person" }
                            : { ios: "creditcard.fill", android: "payments", web: "payments" }}
                        size={23}
                        tintColor={selected ? COLORS.white : COLORS.primary}
                    />
                )}
            </View>
            <View style={styles.selectionFieldCopy}>
                <Text numberOfLines={1} style={[styles.selectionFieldLabel, !selected && styles.selectionFieldPlaceholder]}>
                    {loading ? "Carregando..." : label}
                </Text>
                <Text numberOfLines={2} style={styles.selectionFieldDescription}>{description}</Text>
            </View>
            <SymbolView
                name={{ ios: "chevron.down", android: "keyboard_arrow_down", web: "keyboard_arrow_down" }}
                size={21}
                tintColor={COLORS.textMuted}
            />
        </Pressable>
    );
}

type ChoiceOption = {
    description: string;
    label: string;
    value: string;
};

type ChoiceModalProps = {
    emptyMessage?: string;
    onClose: () => void;
    onSelect: (value: string) => void;
    options: ChoiceOption[];
    selectedValue?: string;
    title: string;
    visible: boolean;
};

function ChoiceModal({ emptyMessage, onClose, onSelect, options, selectedValue, title, visible }: ChoiceModalProps) {
    return (
        <Modal
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            transparent
            visible={visible}
        >
            <View style={styles.choiceOverlay}>
                <Pressable accessibilityLabel="Fechar seleção" onPress={onClose} style={StyleSheet.absoluteFill} />
                <View accessibilityViewIsModal style={styles.choiceCard}>
                    <View style={styles.choiceHeader}>
                        <View style={styles.choiceHeaderCopy}>
                            <Text style={styles.choiceEyebrow}>SELECIONE UMA OPÇÃO</Text>
                            <Text style={styles.choiceTitle}>{title}</Text>
                        </View>
                        <Pressable accessibilityLabel="Fechar" hitSlop={8} onPress={onClose} style={styles.choiceCloseButton}>
                            <SymbolView
                                name={{ ios: "xmark", android: "close", web: "close" }}
                                size={20}
                                tintColor={COLORS.text}
                            />
                        </Pressable>
                    </View>

                    {options.length ? (
                        <ScrollView
                            contentContainerStyle={styles.choiceList}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                            style={styles.choiceListScroll}
                        >
                            {options.map((option) => {
                                const selected = option.value === selectedValue;

                                return (
                                    <Pressable
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: selected }}
                                        key={option.value}
                                        onPress={() => onSelect(option.value)}
                                        style={({ pressed }) => [
                                            styles.choiceOption,
                                            selected && styles.choiceOptionSelected,
                                            pressed && styles.pressed,
                                        ]}
                                    >
                                        <View style={styles.choiceOptionCopy}>
                                            <Text style={styles.choiceOptionLabel}>{option.label}</Text>
                                            <Text style={styles.choiceOptionDescription}>{option.description}</Text>
                                        </View>
                                        <View style={[styles.choiceRadio, selected && styles.choiceRadioSelected]}>
                                            {selected ? <View style={styles.choiceRadioDot} /> : null}
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <Text style={styles.choiceEmpty}>{emptyMessage ?? "Nenhuma opção disponível."}</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

type ServiceGroupProps = {
    description: string;
    onToggle: (serviceId: string) => void;
    selectedIds: string[];
    services: CareService[];
    title: string;
};

function ServiceGroup({ description, onToggle, selectedIds, services, title }: ServiceGroupProps) {
    return (
        <View style={styles.serviceGroup}>
            <Text style={styles.serviceGroupTitle}>{title}</Text>
            <Text style={styles.serviceGroupDescription}>{description}</Text>
            <View style={styles.chipWrap}>
                {services.map((service) => {
                    const selected = selectedIds.includes(service.id);

                    return (
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            key={service.id}
                            onPress={() => onToggle(service.id)}
                            style={({ pressed }) => [
                                styles.serviceChip,
                                selected && styles.optionSelected,
                                pressed && styles.pressed,
                            ]}
                        >
                            {selected ? (
                                <SymbolView
                                    name={{ ios: "checkmark", android: "check", web: "check" }}
                                    size={14}
                                    tintColor={COLORS.white}
                                />
                            ) : null}
                            <Text style={[styles.serviceChipText, selected && styles.optionTextSelected]}>
                                {service.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.mapBackground },
    mapArea: { height: 200, backgroundColor: COLORS.mapBackground },
    mapAreaSearching: { bottom: 0, height: "100%", left: 0, position: "absolute", right: 0, top: 0 },
    sheet: { flex: 1, marginTop: -24, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: "hidden" },
    sheetTopSpacer: { height: 23, alignItems: "center", justifyContent: "flex-start", paddingTop: 9 },
    content: { width: "100%", maxWidth: 680, alignSelf: "center", paddingHorizontal: 16, paddingTop: 8 },
    contentCompact: { paddingHorizontal: 12 },
    handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.handle },
    header: { flexDirection: "row", alignItems: "center" },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12, elevation: 1, shadowColor: COLORS.text, shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
    headerCopy: { flex: 1, paddingTop: 1 },
    title: { color: COLORS.text, fontSize: 23, lineHeight: 29, fontWeight: "800" },
    subtitle: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 300 },
    section: { marginTop: 14, backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, elevation: 1, shadowColor: COLORS.text, shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    sectionTitle: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "800" },
    sectionDescription: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4 },
    selectionField: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 15, borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.background, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10 },
    selectionFieldSelected: { borderColor: COLORS.primaryBorderSoft, backgroundColor: COLORS.primarySoft },
    selectionFieldIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.surface },
    selectionFieldIconSelected: { backgroundColor: COLORS.primary },
    selectionFieldCopy: { flex: 1, minWidth: 0 },
    selectionFieldLabel: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
    selectionFieldPlaceholder: { color: COLORS.textMuted },
    selectionFieldDescription: { color: COLORS.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 },
    selectionErrorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 },
    selectionError: { flex: 1, color: COLORS.danger, fontSize: 10, lineHeight: 15 },
    selectionRetry: { color: COLORS.primary, fontSize: 10, fontWeight: "800" },
    durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
    durationButton: { width: "30%", minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
    durationButtonTwoColumns: { width: "47%" },
    addDurationButton: { flexDirection: "row", gap: 5 },
    durationText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
    customDurationSelected: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
    optionSelected: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary },
    optionTextSelected: { color: COLORS.white },
    inlineEditor: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: COLORS.surfaceSubtle, borderRadius: 14, padding: 12, marginTop: 12 },
    inlineInput: { flex: 1 },
    confirmInlineButton: { width: 50, height: 54, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: 27 },
    serviceGroup: { marginTop: 16, backgroundColor: COLORS.surfaceSubtle, borderRadius: 14, padding: 12 },
    serviceGroupTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
    serviceGroupDescription: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },
    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 10 },
    serviceChip: { minHeight: 42, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderMuted, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
    serviceChipText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
    customServicesArea: { marginTop: 19 },
    customServiceChip: { minHeight: 40, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
    customServiceText: { flexShrink: 1, color: COLORS.primary, fontSize: 12, fontWeight: "700" },
    addServiceButton: { minHeight: 44, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, backgroundColor: COLORS.primary, paddingHorizontal: 13, marginTop: 16 },
    addServiceText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
    recommendationCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: COLORS.primaryBorderSoft, padding: 16, marginTop: 14 },
    recommendationCardEmpty: { backgroundColor: COLORS.surfaceDisabled, borderColor: COLORS.borderStrong },
    recommendationIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
    recommendationIconEmpty: { backgroundColor: COLORS.disabled },
    recommendationCopy: { flex: 1, marginLeft: 12 },
    recommendationEyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.65 },
    recommendationTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800", marginTop: 3 },
    recommendationDescription: { color: COLORS.textMuted, fontSize: 11, lineHeight: 16, marginTop: 4 },
    submitButton: { marginTop: 14 },
    submitError: { color: "#C84848", fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: "center" },
    fieldLabel: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginBottom: 7 },
    fieldInput: { minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderMuted, backgroundColor: COLORS.background, color: COLORS.text, fontSize: 14, paddingHorizontal: 13, paddingVertical: 11 },
    fieldInputMultiline: { minHeight: 118, paddingTop: 13 },
    fieldInputError: { borderColor: "#C84848" },
    fieldHelper: { color: COLORS.textMuted, fontSize: 10, lineHeight: 15, marginTop: 6 },
    fieldError: { color: "#C84848" },
    primaryButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.primary, paddingHorizontal: 18, elevation: 2, shadowColor: COLORS.primary, shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    primaryButtonDisabled: { backgroundColor: COLORS.disabled, elevation: 0, shadowOpacity: 0 },
    primaryButtonPressed: { opacity: 0.86, transform: [{ scale: 0.995 }] },
    primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
    primaryButtonTextDisabled: { color: COLORS.textMuted },
    searchTopBar: { left: 16, position: "absolute", right: 16, zIndex: 2, flexDirection: "row", alignItems: "flex-start", gap: 10 },
    searchTopBarCompact: { left: 10, right: 10, gap: 8 },
    searchBackButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", elevation: 3, shadowColor: COLORS.text, shadowOpacity: 0.14, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    searchAddressCard: { flex: 1, minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.surface, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, paddingVertical: 9, elevation: 3, shadowColor: COLORS.text, shadowOpacity: 0.14, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    searchAddressCopy: { flex: 1 },
    searchAddressLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: "700", letterSpacing: 0.2 },
    searchAddressText: { color: COLORS.text, fontSize: 12, fontWeight: "800", lineHeight: 16, marginTop: 2 },
    acceptedProvidersOverlay: { position: "absolute", left: 16, right: 16, zIndex: 3 },
    acceptedProviderCard: { position: "absolute", left: 0, right: 0, top: 0, minHeight: 70, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 17, borderWidth: 1, borderColor: COLORS.primaryBorderSoft, backgroundColor: COLORS.surface, paddingHorizontal: 11, paddingVertical: 9, elevation: 7, shadowColor: COLORS.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.17, shadowRadius: 8 },
    acceptedProviderAvatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: COLORS.primary },
    acceptedProviderInitials: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
    acceptedProviderCopy: { flex: 1, minWidth: 0 },
    acceptedProviderEyebrow: { color: COLORS.secondary, fontSize: 7, fontWeight: "900", letterSpacing: 0.45 },
    acceptedProviderName: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 2 },
    acceptedProviderMeta: { color: COLORS.textMuted, fontSize: 9, marginTop: 2 },
    acceptedProviderPrice: { alignItems: "flex-end", borderRadius: 10, backgroundColor: COLORS.secondarySoft, paddingHorizontal: 8, paddingVertical: 7 },
    acceptedProviderPriceLabel: { color: COLORS.textMuted, fontSize: 7, fontWeight: "800" },
    acceptedProviderPriceValue: { color: COLORS.secondary, fontSize: 11, fontWeight: "900", marginTop: 2 },
    moreAcceptedProviders: { position: "absolute", left: 8, right: 8, color: COLORS.text, fontSize: 9, fontWeight: "800", textAlign: "center", textShadowColor: COLORS.surface, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    searchSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 11, alignItems: "center", elevation: 8, shadowColor: COLORS.text, shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: -3 } },
    searchSheetCompactWidth: { paddingHorizontal: 14 },
    searchSheetCompactHeight: { paddingTop: 8 },
    searchingIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, marginTop: 3 },
    searchingIconCompact: { width: 58, height: 58, borderRadius: 29, marginTop: 0 },
    searchingTitle: { color: COLORS.text, fontSize: 22, lineHeight: 28, fontWeight: "800", marginTop: 17, textAlign: "center" },
    searchingTitleCompact: { fontSize: 20, lineHeight: 25, marginTop: 11 },
    searchingDescription: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 320, textAlign: "center" },
    searchSummary: { width: "100%", maxWidth: 520, minHeight: 72, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 18, paddingHorizontal: 14 },
    searchSummaryCompact: { minHeight: 64, marginTop: 12 },
    searchSummaryItem: { flex: 1 },
    searchSummaryDivider: { width: 1, height: 38, backgroundColor: COLORS.border, marginHorizontal: 12 },
    searchSummaryLabel: { color: COLORS.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
    searchSummaryValue: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginTop: 4 },
    cancelSearchButton: { width: "100%", maxWidth: 520, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, marginTop: 12 },
    cancelSearchText: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
    cancelPopupOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38, 35, 38, 0.55)", padding: 24 },
    cancelPopupOverlayCompact: { padding: 14 },
    cancelPopupCard: { width: "100%", maxWidth: 380, alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 22, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 24, elevation: 10, shadowColor: COLORS.text, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    cancelPopupIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.dangerSoft },
    cancelPopupTitle: { color: COLORS.text, fontSize: 20, lineHeight: 26, fontWeight: "800", marginTop: 16, textAlign: "center" },
    cancelPopupDescription: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 310, textAlign: "center" },
    cancelPopupError: { color: COLORS.danger, fontSize: 11, lineHeight: 16, marginTop: 11, textAlign: "center" },
    cancelPopupActions: { width: "100%", gap: 9, marginTop: 20 },
    keepSearchingButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: COLORS.borderStrong },
    keepSearchingText: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
    confirmCancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: COLORS.danger },
    confirmCancelText: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
    debugHomeButton: { minHeight: 34, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
    debugHomeText: { color: COLORS.primary, fontSize: 11, fontWeight: "800", textAlign: "center", textDecorationLine: "underline" },
    choiceOverlay: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(38, 35, 38, 0.55)", padding: 20 },
    choiceCard: { width: "100%", maxWidth: 420, maxHeight: "78%", borderRadius: 24, backgroundColor: COLORS.surface, padding: 20, elevation: 10, shadowColor: COLORS.text, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
    choiceHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    choiceHeaderCopy: { flex: 1 },
    choiceEyebrow: { color: COLORS.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.65 },
    choiceTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "800", marginTop: 4 },
    choiceCloseButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: COLORS.surfaceSubtle },
    choiceListScroll: { marginTop: 18 },
    choiceList: { gap: 9, paddingBottom: 2 },
    choiceOption: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background, paddingHorizontal: 14, paddingVertical: 11 },
    choiceOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    choiceOptionCopy: { flex: 1, minWidth: 0 },
    choiceOptionLabel: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
    choiceOptionDescription: { color: COLORS.textMuted, fontSize: 10, lineHeight: 14, marginTop: 3 },
    choiceRadio: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 2, borderColor: COLORS.borderStrong },
    choiceRadioSelected: { borderColor: COLORS.primary },
    choiceRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
    choiceEmpty: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 22, marginBottom: 8 },
    pressed: { opacity: 0.65 },
});
