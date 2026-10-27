import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
    buscarCuidadoresDisponiveis,
    buscarFamiliaComIdosos,
    type CuidadorApi,
    type FamiliaApi,
    type IdosoApi,
} from "@/features/app_cliente/home/service/api_cliente";

const FAMILY_COLORS = ["#E8C7A6", "#DDE8B8", "#C9DCEB", "#E7D3EB"];
const PROFESSIONAL_COLORS = ["#E8C7A6", "#C9DCEB", "#DDE8B8", "#E7D3EB"];

export type HomeFamily = {
    age: number;
    care: string;
    color: string;
    id: string;
    initials: string;
    name: string;
    relation: string;
};

export type HomeProfessional = {
    color: string;
    id: string;
    initials: string;
    name: string;
    role: string;
    status: string;
};

function calcularIdade(dataNascimento: string) {
    const hoje = new Date();
    const [ano, mes, dia] = dataNascimento.split("-").map(Number);
    let idade = hoje.getFullYear() - ano;
    const aniversarioAindaNaoOcorreu =
        hoje.getMonth() + 1 < mes ||
        (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);

    if (aniversarioAindaNaoOcorreu) {
        idade -= 1;
    }

    return idade;
}

function criarIniciais(nome: string) {
    const partes = nome.trim().split(/\s+/);

    return partes
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("");
}

function mapearIdosoParaHome(idoso: IdosoApi, index: number): HomeFamily {
    return {
        age: calcularIdade(idoso.data_nascimento),
        care: idoso.observacoes ?? "Sem observações cadastradas",
        color: FAMILY_COLORS[index % FAMILY_COLORS.length],
        id: idoso.id_idoso,
        initials: criarIniciais(idoso.nome),
        name: idoso.nome,
        relation: "Pessoa idosa",
    };
}

function mapearCuidadorParaHome(
    cuidador: CuidadorApi,
    index: number,
): HomeProfessional {
    return {
        color: PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length],
        id: cuidador.id_cuidador,
        initials: criarIniciais(cuidador.nome),
        name: cuidador.nome,
        role: cuidador.tipo_profissional === "ENFERMEIRO"
            ? "Profissional enfermeiro"
            : "Profissional cuidador",
        status: "Disponível agora",
    };
}

export function useHomeViewModel() {
    const router = useRouter();
    const { familiaId: familiaIdParam } = useLocalSearchParams<{ familiaId?: string | string[] }>();
    const familiaId = Array.isArray(familiaIdParam) ? familiaIdParam[0] : familiaIdParam ?? "1";
    const [familia, setFamilia] = useState<FamiliaApi | null>(null);
    const [idosos, setIdosos] = useState<IdosoApi[]>([]);
    const [cuidadores, setCuidadores] = useState<CuidadorApi[]>([]);
    const [isLoadingFamily, setIsLoadingFamily] = useState(true);
    const [familyError, setFamilyError] = useState<string | null>(null);
    const [isFamilyPickerVisible, setIsFamilyPickerVisible] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
    const [professionalsError, setProfessionalsError] = useState<string | null>(null);
    const [professionalsReloadKey, setProfessionalsReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoadingFamily(true);
        setFamilyError(null);

        buscarFamiliaComIdosos(familiaId, controller.signal)
            .then((response) => {
                setFamilia(response.familia);
                setIdosos(response.idosos);
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                setFamilyError(
                    "Não foi possível carregar os familiares. Verifique se o JSON Server está ativo.",
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingFamily(false);
                }
            });

        return () => controller.abort();
    }, [familiaId, reloadKey]);

    useEffect(() => {
        const controller = new AbortController();

        setIsLoadingProfessionals(true);
        setProfessionalsError(null);

        buscarCuidadoresDisponiveis(controller.signal)
            .then(setCuidadores)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }

                setProfessionalsError(
                    "Não foi possível carregar os profissionais disponíveis.",
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoadingProfessionals(false);
                }
            });

        return () => controller.abort();
    }, [professionalsReloadKey]);

    const familiares = useMemo(
        () => idosos.map(mapearIdosoParaHome),
        [idosos],
    );
    const profissionais = useMemo(
        () => cuidadores.map(mapearCuidadorParaHome),
        [cuidadores],
    );

    function selectFamily(family: HomeFamily) {
        setIsFamilyPickerVisible(false);
        router.push({
            pathname: "/solicitacao",
            params: {
                familiar: family.name,
                idosoId: family.id,
            },
        });
    }

    return {
        changeProfile: () => router.replace("/"),
        closeFamilyPicker: () => setIsFamilyPickerVisible(false),
        familia,
        familiaId,
        familiares,
        familyError,
        isFamilyPickerVisible,
        isLoadingFamily,
        isLoadingProfessionals,
        openClientHistory: () =>
            router.push({
                pathname: "/historico_atendimentos",
                params: { familiaId },
            }),
        openClientProfile: () => router.push({ pathname: "/perfil", params: { familiaId } }),
        openFamilyPicker: () => setIsFamilyPickerVisible(true),
        reloadFamily: () => setReloadKey((current) => current + 1),
        profissionais,
        professionalsError,
        reloadProfessionals: () =>
            setProfessionalsReloadKey((current) => current + 1),
        selectFamily,
    };
}
