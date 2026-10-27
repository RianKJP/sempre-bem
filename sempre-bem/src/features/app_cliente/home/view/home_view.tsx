import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeBannerCarousel } from "@/features/app_cliente/home/components/home_banner_carousel";
import { ProfessionalCard } from "@/features/app_cliente/home/components/home_professional_card";
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
        closeFamilyPicker,
        familia,
        familiares,
        familyError,
        isFamilyPickerVisible,
        isLoadingFamily,
        isLoadingProfessionals,
        openClientHistory,
        openClientProfile,
        openFamilyPicker,
        reloadFamily,
        profissionais,
        professionalsError,
        reloadProfessionals,
        selectFamily,
    } = useHomeViewModel();

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
                    { paddingBottom: 104 + insets.bottom },
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

                <Pressable
                    accessibilityRole="button"
                    onPress={openClientHistory}
                    style={({ pressed }) => [styles.debugButton, pressed && styles.pressed]}
                >
                    <SymbolView
                        name={{ ios: "ladybug.fill", android: "bug_report", web: "bug_report" }}
                        size={15}
                        tintColor={COLORS.primary}
                    />
                    <Text style={styles.debugButtonText}>DEBUG: abrir histórico do cliente</Text>
                </Pressable>

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

            <View
                style={[
                    styles.bottomNav,
                    {
                        height: 72 + insets.bottom,
                        paddingBottom: Math.max(insets.bottom, 8),
                    },
                ]}
            >
                <HomeNavItem icon={{ ios: "house.fill", android: "home", web: "home" }} label="Início" active />
                <HomeNavItem icon={{ ios: "magnifyingglass", android: "search", web: "search" }} label="Buscar" />
                <HomeNavItem icon={{ ios: "map", android: "map", web: "map" }} label="Mapa" />
                <HomeNavItem icon={{ ios: "bubble.left.fill", android: "chat_bubble", web: "chat_bubble" }} label="Mensagens" />
                <HomeNavItem
                    icon={{ ios: "person.fill", android: "person", web: "person" }}
                    label="Perfil"
                    onPress={openClientProfile}
                />
            </View>

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

                        <Pressable style={styles.addFamilyButton}>
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

type HomeNavItemProps = {
    active?: boolean;
    icon: SymbolViewProps["name"];
    label: string;
    onPress?: () => void;
};

function HomeNavItem({ active = false, icon, label, onPress }: HomeNavItemProps) {
    return (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
            <SymbolView
                name={icon}
                size={22}
                tintColor={active ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Pressable>
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
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 104 },
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
    debugButton: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.primary, borderRadius: 9, marginTop: 16 },
    debugButtonText: { color: COLORS.primary, fontSize: 9, fontWeight: "800" },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 12 },
    sectionAction: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
    emptyText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center", paddingVertical: 18 },
    bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
    navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
    navLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
    navLabelActive: { color: COLORS.primary, fontWeight: "800" },
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
});
