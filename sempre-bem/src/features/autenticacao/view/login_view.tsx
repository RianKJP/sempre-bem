import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { authenticate } from "@/features/autenticacao/service/auth_service";

type Profile = "cliente" | "profissional";

function normalizeProfile(value: string | string[] | undefined): Profile {
    const selected = Array.isArray(value) ? value[0] : value;
    return selected === "profissional" ? "profissional" : "cliente";
}

export default function LoginView() {
    const router = useRouter();
    const { perfil, email: emailParam } = useLocalSearchParams<{ perfil?: string | string[]; email?: string | string[] }>();
    const profile = normalizeProfile(perfil);
    const passwordRef = useRef<TextInput>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [formError, setFormError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const profileLabel = profile === "cliente" ? "Cliente" : "Profissional";

    useEffect(() => {
        const value = Array.isArray(emailParam) ? emailParam[0] : emailParam;
        if (value) setEmail(value);
    }, [emailParam]);

    async function submit() {
        if (submitting) return;
        const nextErrors: typeof errors = {};

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            nextErrors.email = "Informe um e-mail válido.";
        }
        if (password.length < 8) {
            nextErrors.password = "Informe sua senha com pelo menos 8 caracteres.";
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        setFormError(undefined);
        setSubmitting(true);
        try {
            const account = await authenticate(profile, email, password);
            if (account.profile === "cliente") {
                router.replace({ pathname: "/cliente", params: { familiaId: account.userId } });
            } else {
                router.replace({ pathname: "/cuidador", params: { prestadorId: account.userId } });
            }
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Não foi possível entrar.");
        } finally {
            setSubmitting(false);
        }
    }

    function openRegistration() {
        if (profile === "cliente") {
            router.push({ pathname: "/cadastro", params: { perfil: profile } });
            return;
        }

        router.push("/cadastro-dados");
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.safeArea}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        accessibilityLabel="Voltar para a escolha de perfil"
                        accessibilityRole="button"
                        onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </Pressable>

                    <View style={styles.brand}>
                        <Image
                            accessibilityIgnoresInvertColors
                            source={require("@/assets/logos/logo_sempre_bem.png")}
                            style={styles.logo}
                        />
                        <Text style={styles.brandName}>SEMPRE BEM</Text>
                    </View>

                    <View style={styles.heading}>
                        <Text style={styles.eyebrow}>ACESSO DE {profileLabel.toUpperCase()}</Text>
                        <Text style={styles.title}>Entre na sua conta</Text>
                        <Text style={styles.subtitle}>
                            Use seus dados para acessar a área de {profileLabel.toLowerCase()}.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            error={errors.email}
                            keyboardType="email-address"
                            label="E-mail"
                            onChangeText={(value) => {
                                setEmail(value);
                                setErrors((current) => ({ ...current, email: undefined }));
                                setFormError(undefined);
                            }}
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            placeholder="seu@email.com"
                            returnKeyType="next"
                            value={email}
                        />
                        <Input
                            autoComplete="current-password"
                            error={errors.password}
                            label="Senha"
                            onChangeText={(value) => {
                                setPassword(value);
                                setErrors((current) => ({ ...current, password: undefined }));
                                setFormError(undefined);
                            }}
                            onSubmitEditing={submit}
                            placeholder="Sua senha"
                            ref={passwordRef}
                            returnKeyType="done"
                            secureTextEntry
                            value={password}
                        />
                        {formError ? <Text accessibilityLiveRegion="polite" style={styles.formError}>{formError}</Text> : null}
                        <Button disabled={submitting} label={submitting ? "Validando..." : "Entrar"} onPress={submit} />
                    </View>

                    <View style={styles.registrationRow}>
                        <Text style={styles.registrationText}>Ainda não tem uma conta?</Text>
                        <Pressable
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={openRegistration}
                            style={({ pressed }) => pressed && styles.pressed}
                        >
                            <Text style={styles.registrationLink}>Cadastre-se</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#F7F3EA" },
    content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#DED5DA",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    backIcon: { color: "#713568", fontSize: 34, lineHeight: 36, marginTop: -3 },
    brand: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 38 },
    logo: { width: 48, height: 48, borderRadius: 14 },
    brandName: { color: "#713568", fontSize: 13, fontWeight: "900", letterSpacing: 1.8 },
    heading: { marginTop: 38 },
    eyebrow: { color: "#91A83D", fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: "#30272D", fontSize: 30, lineHeight: 38, fontWeight: "900", marginTop: 8 },
    subtitle: { color: "#82777E", fontSize: 15, lineHeight: 22, marginTop: 8 },
    form: { gap: 16, marginTop: 32 },
    formError: { color: "#A12636", fontSize: 12, lineHeight: 18, marginTop: -4 },
    registrationRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 24 },
    registrationText: { color: "#82777E", fontSize: 13 },
    registrationLink: { color: "#713568", fontSize: 13, fontWeight: "800" },
    pressed: { opacity: 0.65 },
});
