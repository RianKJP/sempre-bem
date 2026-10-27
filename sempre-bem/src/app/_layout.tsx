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
                name="login"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="cadastro"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="cadastro-dados"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="cadastro-profissional"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="perfil"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="conta"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="diario-bordo"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="atendimentos"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="pessoas-cuidadas"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="pessoa-cuidada"
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
