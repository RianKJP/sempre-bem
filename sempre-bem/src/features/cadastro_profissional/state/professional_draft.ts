import { useSyncExternalStore } from "react";

export const PROFESSIONAL_SPECIALTIES = [
    "Acompanhamento",
    "Mobilidade",
    "Alimentação",
    "Medicação",
    "Companhia",
    "Higiene",
    "Fisioterapia",
    "Alzheimer",
] as const;

export type ProfessionalType = "CUIDADOR" | "ENFERMEIRO";
export type ProfessionalSpecialty = typeof PROFESSIONAL_SPECIALTIES[number];
export type ProfessionalData = {
    description: string;
    education: string;
    experience: string;
    specialties: ProfessionalSpecialty[];
    type: ProfessionalType;
};
export type ProfessionalErrors = Partial<Record<keyof ProfessionalData, string>>;

export const initialProfessional: ProfessionalData = {
    description: "",
    education: "",
    experience: "",
    specialties: [],
    type: "CUIDADOR",
};

export function validateProfessional(value: ProfessionalData): ProfessionalErrors {
    const errors: ProfessionalErrors = {};
    if (!value.type) errors.type = "Selecione o tipo de profissional.";
    if (!value.specialties.length) errors.specialties = "Selecione pelo menos uma especialidade.";
    if (!value.experience.trim()) errors.experience = "Informe seu tempo de experiência.";
    if (!value.education.trim()) errors.education = "Informe sua formação.";
    return errors;
}

let professional = initialProfessional;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => professional;

export function updateProfessional(value: ProfessionalData) {
    professional = { ...value, specialties: [...value.specialties] };
    listeners.forEach((listener) => listener());
}
export function resetProfessionalDraft() { updateProfessional(initialProfessional); }
export function useProfessionalDraft() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
