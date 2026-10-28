import { Tabs, useGlobalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResponsiveTabLabel } from "@/core/components/responsive_tab_label";

type ProviderTab = {
    href: "/cuidador" | "/atendimento-prestador" | "/perfil-prestador";
    icon: SymbolViewProps["name"];
    name: "cuidador" | "atendimento-prestador" | "perfil-prestador";
    title: string;
};

const TABS: ProviderTab[] = [
    { href: "/cuidador", name: "cuidador", title: "Início", icon: { ios: "house", android: "home", web: "home" } },
    { href: "/atendimento-prestador", name: "atendimento-prestador", title: "Atendimento", icon: { ios: "heart", android: "favorite_border", web: "favorite_border" } },
    { href: "/perfil-prestador", name: "perfil-prestador", title: "Perfil", icon: { ios: "person", android: "person_outline", web: "person_outline" } },
];

export default function PrestadorTabsLayout() {
    const insets = useSafeAreaInsets();
    const { prestadorId: prestadorIdParam } = useGlobalSearchParams<{ prestadorId?: string | string[] }>();
    const prestadorId = Array.isArray(prestadorIdParam) ? prestadorIdParam[0] : prestadorIdParam;

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#743268",
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
                        href: prestadorId
                            ? { pathname: tab.href, params: { prestadorId } }
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
