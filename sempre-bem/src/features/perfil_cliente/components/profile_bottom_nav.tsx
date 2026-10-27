import { useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type ClientTab = "Buscar" | "Diário" | "Início" | "Perfil";

type NavItem = {
    icon: SymbolViewProps["name"];
    label: ClientTab;
};

const ITEMS: NavItem[] = [
    { label: "Início", icon: { ios: "house", android: "home", web: "home" } },
    { label: "Buscar", icon: { ios: "magnifyingglass", android: "search", web: "search" } },
    { label: "Diário", icon: { ios: "book", android: "menu_book", web: "menu_book" } },
    { label: "Perfil", icon: { ios: "person", android: "person_outline", web: "person_outline" } },
];

type Props = {
    familiaId: string;
    selected: ClientTab;
};

export function ProfileBottomNav({ familiaId, selected }: Props) {
    const router = useRouter();

    function openTab(label: ClientTab) {
        if (label === selected) return;

        if (label === "Início") {
            router.replace({ pathname: "/cliente", params: { familiaId } });
        } else if (label === "Buscar") {
            router.replace({ pathname: "/solicitacao", params: { familiaId } });
        } else if (label === "Diário") {
            router.replace({ pathname: "/diario-bordo", params: { familiaId } });
        } else {
            router.replace({ pathname: "/perfil", params: { familiaId } });
        }
    }

    return (
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <View accessibilityRole="tablist" style={styles.nav}>
                {ITEMS.map((item) => {
                    const active = item.label === selected;
                    return (
                        <Pressable
                            accessibilityRole="tab"
                            accessibilityState={{ selected: active }}
                            key={item.label}
                            onPress={() => openTab(item.label)}
                            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                        >
                            <SymbolView
                                name={item.icon}
                                size={29}
                                tintColor={active ? "#A6B778" : "#91A2BC"}
                            />
                            <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#FFFFFF",
        borderTopColor: "#E5E8ED",
        borderTopWidth: 1,
        width: "100%",
    },
    nav: {
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        minHeight: 82,
        paddingHorizontal: 14,
        paddingTop: 11,
        width: "100%",
        maxWidth: 680,
    },
    item: {
        alignItems: "center",
        flex: 1,
        gap: 4,
        justifyContent: "flex-start",
        minHeight: 62,
    },
    label: {
        color: "#41516C",
        fontFamily: "Poppins-Regular",
        fontSize: 13,
        lineHeight: 20,
        includeFontPadding: false,
    },
    activeLabel: { color: "#A6B778", fontFamily: "Poppins-Medium" },
    pressed: { opacity: 0.62 },
});
