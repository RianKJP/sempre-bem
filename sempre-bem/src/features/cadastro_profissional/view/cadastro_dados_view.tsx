import { useRef, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

import { BRAZILIAN_PHONE_MAX_LENGTH, formatBrazilianPhone } from "@/core/utils/phone";
import { RegistrationField } from "@/features/cadastro_profissional/components/registration_field";
import {
    RegistrationLayout,
    type RegistrationStep,
} from "@/features/cadastro_profissional/components/registration_layout";
import {
    updatePersonal,
    usePersonalDraft,
    validatePersonal,
    type PersonalData,
    type PersonalErrors,
} from "@/features/cadastro_profissional/state/draft";

type PersonalField = "name" | "phone" | "email" | "password" | "confirmation";

const fields: { key: PersonalField; label: string; placeholder: string }[] = [
    { key: "name", label: "Nome completo", placeholder: "Seu nome completo" },
    { key: "phone", label: "Telefone", placeholder: "(11) 99999-9999" },
    { key: "email", label: "E-mail", placeholder: "seu@email.com" },
    { key: "password", label: "Senha", placeholder: "Crie uma senha" },
    { key: "confirmation", label: "Confirmar senha", placeholder: "Repita sua senha" },
];

export default function CadastroDadosScreen() {
    const router = useRouter();
    const draft = usePersonalDraft();
    const [errors, setErrors] = useState<PersonalErrors>({});
    const [picking, setPicking] = useState(false);
    const refs = useRef<Partial<Record<PersonalField, TextInput | null>>>({});

    function goToProfessional() {
        const validation = validatePersonal(draft);
        const nextErrors = Object.fromEntries(
            fields
                .filter(({ key }) => validation[key])
                .map(({ key }) => [key, validation[key]]),
        ) as PersonalErrors;

        setErrors(nextErrors);
        const first = fields.find(({ key }) => nextErrors[key]);
        if (first) {
            refs.current[first.key]?.focus();
            return;
        }

        Keyboard.dismiss();
        router.navigate("/cadastro-profissional");
    }

    function selectStep(step: RegistrationStep) {
        if (step === 2) goToProfessional();
    }

    async function pickPhoto() {
        if (picking) return;
        setPicking(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                updatePersonal({ ...draft, photoUri: result.assets[0].uri });
            }
        } catch {
            Alert.alert("Foto indisponível", "Não foi possível abrir a galeria. Verifique as permissões e tente novamente.");
        } finally {
            setPicking(false);
        }
    }

    return (
        <RegistrationLayout
            step={1}
            buttonTitle="Continuar"
            onSubmit={goToProfessional}
            onBack={() =>
                router.canGoBack()
                    ? router.back()
                    : router.replace({ pathname: "/login", params: { perfil: "profissional" } })
            }
            onStep={selectStep}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Adicionar foto de perfil"
                accessibilityState={{ busy: picking }}
                disabled={picking}
                onPress={pickPhoto}
                style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
            >
                <View style={styles.avatar}>
                    {draft.photoUri ? (
                        <Image source={{ uri: draft.photoUri }} style={styles.photo} contentFit="cover" />
                    ) : (
                        <Image source={require("@/assets/figma/cadastro-profissional/person.svg")} style={styles.personIcon} contentFit="contain" />
                    )}
                </View>
                <Text style={styles.photoLabel}>Adicionar foto de perfil</Text>
            </Pressable>
            <View style={styles.fields}>
                {fields.map(({ key, label, placeholder }, index) => (
                    <RegistrationField
                        key={key}
                        ref={(input) => { refs.current[key] = input; }}
                        nativeID={`profissional-${key}`}
                        label={label}
                        placeholder={placeholder}
                        value={draft[key]}
                        error={errors[key]}
                        onChangeText={(value) => {
                            updatePersonal({
                                ...draft,
                                [key]: key === "phone" ? formatBrazilianPhone(value) : value,
                            } as PersonalData);
                            setErrors((previous) => ({
                                ...previous,
                                [key]: undefined,
                                ...(key === "password" ? { confirmation: undefined } : {}),
                            }));
                        }}
                        keyboardType={key === "phone" ? "phone-pad" : key === "email" ? "email-address" : "default"}
                        maxLength={key === "phone" ? BRAZILIAN_PHONE_MAX_LENGTH : undefined}
                        autoCapitalize={key === "name" ? "words" : "none"}
                        autoCorrect={false}
                        autoComplete={key === "name" ? "name" : key === "email" ? "email" : key === "phone" ? "tel" : "new-password"}
                        showPasswordToggle={key === "password" || key === "confirmation"}
                        returnKeyType={index === fields.length - 1 ? "done" : "next"}
                        submitBehavior="submit"
                        onSubmitEditing={() =>
                            index === fields.length - 1
                                ? goToProfessional()
                                : refs.current[fields[index + 1].key]?.focus()
                        }
                    />
                ))}
            </View>
        </RegistrationLayout>
    );
}

const styles = StyleSheet.create({
    photoButton: { alignItems: "center", paddingTop: 12, gap: 8 },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#EEEAE2", borderWidth: 1.1, borderStyle: "dashed", borderColor: "#DDD5D2", justifyContent: "center", alignItems: "center", overflow: "hidden" },
    personIcon: { width: 30, height: 30 },
    photo: { width: "100%", height: "100%" },
    photoLabel: { fontFamily: "Poppins-Regular", fontSize: 11, color: "#81767B" },
    fields: { marginTop: 12, gap: 13, paddingBottom: 13 },
    pressed: { opacity: 0.65 },
});
