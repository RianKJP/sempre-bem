export type ProfessionalType = "Cuidador" | "Enfermeiro";

export type CareService = {
    id: string;
    label: string;
    professional: ProfessionalType;
};

export const DURATION_OPTIONS = [3, 4, 5, 6, 7, 8] as const;

export const CAREGIVER_SERVICES: CareService[] = [
    { id: "alimentacao", label: "Auxílio na alimentação", professional: "Cuidador" },
    { id: "banho", label: "Auxiliar no banho", professional: "Cuidador" },
    { id: "higiene", label: "Cuidados de higiene", professional: "Cuidador" },
    { id: "vestimenta", label: "Auxílio com vestimenta", professional: "Cuidador" },
    { id: "caminhar", label: "Auxiliar ao caminhar", professional: "Cuidador" },
    { id: "companhia", label: "Companhia e atividades", professional: "Cuidador" },
];

export const NURSE_SERVICES: CareService[] = [
    { id: "sonda", label: "Cuidados com sonda", professional: "Enfermeiro" },
    { id: "suturas", label: "Cuidados com suturas", professional: "Enfermeiro" },
    { id: "curativos", label: "Troca de curativos", professional: "Enfermeiro" },
    { id: "sinais-vitais", label: "Aferir sinais vitais", professional: "Enfermeiro" },
    { id: "medicacao", label: "Administração de medicação", professional: "Enfermeiro" },
    { id: "monitoramento", label: "Monitoramento clínico", professional: "Enfermeiro" },
];

const ALL_SERVICES = [...CAREGIVER_SERVICES, ...NURSE_SERVICES];

export function getProfessionalRecommendation(selectedServiceIds: string[]): ProfessionalType | null {
    const selectedServices = ALL_SERVICES.filter((service) => selectedServiceIds.includes(service.id));

    if (selectedServices.some((service) => service.professional === "Enfermeiro")) {
        return "Enfermeiro";
    }

    if (selectedServices.some((service) => service.professional === "Cuidador")) {
        return "Cuidador";
    }

    return null;
}

export function parseCustomDuration(value: string) {
    const duration = Number(value);

    if (!/^\d+$/.test(value.trim()) || duration < 1 || duration > 24) {
        return null;
    }

    return duration;
}
