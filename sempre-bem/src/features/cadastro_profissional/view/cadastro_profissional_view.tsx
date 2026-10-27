import { useRef, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { AuthServiceError, registerProfessional } from "@/features/autenticacao/service/auth_service";
import { RegistrationField } from "@/features/cadastro_profissional/components/registration_field";
import { RegistrationLayout, type RegistrationStep } from "@/features/cadastro_profissional/components/registration_layout";
import { resetPersonalDraft, usePersonalDraft, validatePersonal } from "@/features/cadastro_profissional/state/draft";
import {
    PROFESSIONAL_SPECIALTIES,
    resetProfessionalDraft,
    updateProfessional,
    useProfessionalDraft,
    validateProfessional,
    type ProfessionalErrors,
    type ProfessionalSpecialty,
    type ProfessionalType,
} from "@/features/cadastro_profissional/state/professional_draft";

type TextField = "description" | "education" | "experience";
const personalFields = ["name", "phone", "email", "password", "confirmation"] as const;

export default function CadastroProfissionalScreen() {
    const router = useRouter();
    const personal = usePersonalDraft();
    const professional = useProfessionalDraft();
    const [errors, setErrors] = useState<ProfessionalErrors>({});
    const [formError, setFormError] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const refs = useRef<Partial<Record<TextField, TextInput | null>>>({});

    function goToPersonalData() { router.navigate("/cadastro-dados"); }
    function selectStep(step: RegistrationStep) { if (step === 1) goToPersonalData(); }

    function selectType(type: ProfessionalType) {
        updateProfessional({ ...professional, type });
        setErrors((previous) => ({ ...previous, type: undefined }));
    }

    function toggleSpecialty(specialty: ProfessionalSpecialty) {
        const selected = professional.specialties.includes(specialty);
        updateProfessional({
            ...professional,
            specialties: selected
                ? professional.specialties.filter((value) => value !== specialty)
                : [...professional.specialties, specialty],
        });
        setErrors((previous) => ({ ...previous, specialties: undefined }));
    }

    function updateText(field: TextField, value: string) {
        updateProfessional({ ...professional, [field]: value });
        setErrors((previous) => ({ ...previous, [field]: undefined }));
        setFormError(undefined);
    }

    async function submit() {
        if (submitting) return;

        const personalErrors = validatePersonal(personal);
        if (personalFields.some((key) => personalErrors[key])) {
            Alert.alert(
                "Dados pessoais incompletos",
                "Revise os dados pessoais e de acesso antes de concluir o cadastro.",
                [{ text: "Revisar", onPress: goToPersonalData }],
            );
            return;
        }

        const nextErrors = validateProfessional(professional);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            if (nextErrors.experience) refs.current.experience?.focus();
            else if (nextErrors.education) refs.current.education?.focus();
            else if (nextErrors.description) refs.current.description?.focus();
            return;
        }

        Keyboard.dismiss();
        setFormError(undefined);
        setSubmitting(true);

        try {
            const account = await registerProfessional({ personal, professional });
            resetPersonalDraft();
            resetProfessionalDraft();
            router.replace({ pathname: "/login", params: { perfil: "profissional", email: account.email } });
        } catch (error) {
            setFormError(
                error instanceof AuthServiceError && error.code === "DUPLICATE_EMAIL"
                    ? `${error.message} Volte aos dados pessoais para alterar o e-mail.`
                    : error instanceof Error
                        ? error.message
                        : "Não foi possível criar o perfil profissional.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <RegistrationLayout
            step={2}
            buttonTitle="Criar perfil profissional"
            submitting={submitting}
            onSubmit={submit}
            onBack={goToPersonalData}
            onStep={selectStep}
        >
            <Text style={[styles.sectionLabel, styles.firstLabel]}>Tipo de profissional</Text>
            <View style={styles.typeRow}>
                <TypeButton label="Cuidador" selected={professional.type === "CUIDADOR"} onPress={() => selectType("CUIDADOR")} />
                <TypeButton label="Enfermeiro" selected={professional.type === "ENFERMEIRO"} onPress={() => selectType("ENFERMEIRO")} />
            </View>
            {errors.type ? <Text style={styles.error}>{errors.type}</Text> : null}

            <Text style={styles.sectionLabel}>Especialidades</Text>
            <View style={styles.chips}>
                {PROFESSIONAL_SPECIALTIES.map((specialty) => {
                    const selected = professional.specialties.includes(specialty);
                    return (
                        <Pressable
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            key={specialty}
                            onPress={() => toggleSpecialty(specialty)}
                            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
                        >
                            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{specialty}</Text>
                        </Pressable>
                    );
                })}
            </View>
            {errors.specialties ? <Text style={styles.error}>{errors.specialties}</Text> : null}

            <View style={styles.fields}>
                <RegistrationField
                    ref={(input) => { refs.current.experience = input; }}
                    label="Tempo de experiência"
                    placeholder="Ex: 5 anos"
                    value={professional.experience}
                    error={errors.experience}
                    maxLength={60}
                    onChangeText={(value) => updateText("experience", value)}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => refs.current.education?.focus()}
                />
                <RegistrationField
                    ref={(input) => { refs.current.education = input; }}
                    label="Formação"
                    placeholder="Ex: Técnico em enfermagem"
                    value={professional.education}
                    error={errors.education}
                    maxLength={120}
                    onChangeText={(value) => updateText("education", value)}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => refs.current.description?.focus()}
                />
                <RegistrationField
                    ref={(input) => { refs.current.description = input; }}
                    label="Descrição profissional (opcional)"
                    placeholder="Fale sobre sua experiência e diferenciais..."
                    value={professional.description}
                    error={errors.description}
                    maxLength={600}
                    multiline
                    numberOfLines={5}
                    onChangeText={(value) => updateText("description", value)}
                    returnKeyType="done"
                    style={styles.descriptionInput}
                />
            </View>

            {formError ? <Text accessibilityLiveRegion="polite" style={styles.formError}>{formError}</Text> : null}
        </RegistrationLayout>
    );
}

function TypeButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={({ pressed }) => [styles.typeButton, selected && styles.typeButtonSelected, pressed && styles.pressed]}
        >
            <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    firstLabel: { marginTop: 8 },
    sectionLabel: { marginTop: 18, marginBottom: 9, fontFamily: "Poppins-Medium", fontSize: 12, lineHeight: 18, color: "#262326" },
    typeRow: { flexDirection: "row", gap: 10 },
    typeButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1.1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF" },
    typeButtonSelected: { backgroundColor: "#713568", borderColor: "#713568" },
    typeText: { fontFamily: "Poppins-Regular", fontSize: 11, color: "#81767B" },
    typeTextSelected: { color: "#FFFFFF" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { minHeight: 38, justifyContent: "center", paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.1, borderColor: "#DDD5D2", backgroundColor: "#FFFFFF" },
    chipSelected: { backgroundColor: "#713568", borderColor: "#713568" },
    chipText: { fontFamily: "Poppins-Regular", fontSize: 10, color: "#81767B" },
    chipTextSelected: { color: "#FFFFFF" },
    fields: { marginTop: 20, gap: 14, paddingBottom: 12 },
    descriptionInput: { minHeight: 112, textAlignVertical: "top" },
    error: { marginTop: 6, fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 16, color: "#A12636" },
    formError: { marginTop: 4, fontFamily: "Poppins-Regular", fontSize: 11, lineHeight: 16, color: "#A12636" },
    pressed: { opacity: 0.65 },
});
