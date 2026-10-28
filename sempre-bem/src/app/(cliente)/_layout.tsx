import { Tabs, useGlobalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResponsiveTabLabel } from "@/core/components/responsive_tab_label";

type ClientTab = {
    href: "/cliente" | "/solicitacao" | "/diario-bordo" | "/perfil";
    icon: SymbolViewProps["name"];
    name: "cliente" | "solicitacao" | "diario-bordo" | "perfil";
    title: string;
};

const TABS: ClientTab[] = [
    { href: "/cliente", name: "cliente", title: "Início", icon: { ios: "house", android: "home", web: "home" } },
    { href: "/solicitacao", name: "solicitacao", title: "Buscar", icon: { ios: "magnifyingglass", android: "search", web: "search" } },
    { href: "/diario-bordo", name: "diario-bordo", title: "Diário", icon: { ios: "book", android: "menu_book", web: "menu_book" } },
    { href: "/perfil", name: "perfil", title: "Perfil", icon: { ios: "person", android: "person_outline", web: "person_outline" } },
];

export default function ClienteTabsLayout() {
    const insets = useSafeAreaInsets();
    const { familiaId: familiaIdParam } = useGlobalSearchParams<{ familiaId?: string | string[] }>();
    const familiaId = Array.isArray(familiaIdParam) ? familiaIdParam[0] : familiaIdParam;

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#A6B778",
                tabBarInactiveTintColor: "#91A2BC",
                tabBarHideOnKeyboard: true,
                tabBarItemStyle: styles.item,
                tabBarStyle: [
                    styles.bar,
                    {
                        height: 58 + insets.bottom,
                        paddingBottom: Math.max(insets.bottom, 4),
                    },
                ],
            }}
        >
            {TABS.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        href: familiaId
                            ? { pathname: tab.href, params: { familiaId } }
                            : tab.href,
                        tabBarLabel: ({ color }) => (
                            <ResponsiveTabLabel color={color}>{tab.title}</ResponsiveTabLabel>
                        ),
                        tabBarIcon: ({ color, focused }) => (
                            <SymbolView
                                name={tab.icon}
                                size={focused ? 27 : 26}
                                tintColor={color}
                            />
                        ),
                    }}
                />
            ))}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    bar: {
        backgroundColor: "#FFFFFF",
        borderTopColor: "#E5E8ED",
        borderTopWidth: 1,
        elevation: 8,
        paddingHorizontal: 2,
        paddingTop: 5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    item: {
        paddingHorizontal: 0,
        paddingVertical: 1,
    },
});
