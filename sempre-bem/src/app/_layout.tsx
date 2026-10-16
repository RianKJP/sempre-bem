import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack initialRouteName="index">
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="cliente"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="cuidador"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="solicitacao"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="historico_atendimentos"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
