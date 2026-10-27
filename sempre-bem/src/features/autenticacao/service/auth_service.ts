import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";
import { getRandomBytesAsync } from "expo-crypto";

import { API_BASE_URL } from "@/core/config/api_config";
import type { Availability } from "@/features/cadastro_profissional/state/availability";
import { radiusInKm } from "@/features/cadastro_profissional/state/availability";
import type { PersonalData } from "@/features/cadastro_profissional/state/draft";

export type AuthProfile = "cliente" | "profissional";

export type AuthenticatedAccount = {
    email: string;
    name: string;
    profile: AuthProfile;
    userId: string;
};

export type ClientRegistration = {
    email: string;
    name: string;
    password: string;
    phone: string;
};

export type ProfessionalRegistration = {
    availability: Availability;
    personal: PersonalData;
};

type ApiAccount = {
    email: string;
    id: string;
    id_cuidador?: string;
    id_familia?: string;
    nome: string;
    senha: string;
};

type AuthErrorCode =
    | "DUPLICATE_EMAIL"
    | "INVALID_CREDENTIALS"
    | "SERVER_UNAVAILABLE";

const PASSWORD_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_SALT_LENGTH = 16;
const REQUEST_TIMEOUT_MS = 10_000;

export class AuthServiceError extends Error {
    constructor(
        public readonly code: AuthErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "AuthServiceError";
    }
}

function endpointFor(profile: AuthProfile) {
    return `${API_BASE_URL}/${profile === "cliente" ? "familia" : "cuidador"}`;
}

function normalizeEmail(email: string) {
    return email.trim().toLocaleLowerCase("pt-BR");
}

async function parseResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new AuthServiceError(
            "SERVER_UNAVAILABLE",
            "Não foi possível concluir a operação no servidor.",
        );
    }

    return response.json() as Promise<T>;
}

async function fetchWithTimeout(input: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
        const timedOut = error instanceof Error && error.name === "AbortError";
        throw new AuthServiceError(
            "SERVER_UNAVAILABLE",
            timedOut
                ? `A API não respondeu em 10 segundos (${API_BASE_URL}). Verifique a rede e reinicie o JSON Server.`
                : `Não foi possível acessar a API em ${API_BASE_URL}. Verifique se o JSON Server está ativo.`,
        );
    } finally {
        clearTimeout(timeout);
    }
}

async function findAccountByEmail(profile: AuthProfile, email: string) {
    const normalizedEmail = normalizeEmail(email);
    const response = await fetchWithTimeout(
        `${endpointFor(profile)}?email=${encodeURIComponent(normalizedEmail)}`,
    );

    const accounts = await parseResponse<ApiAccount[]>(response);
    return accounts.find((account) => normalizeEmail(account.email) === normalizedEmail);
}

async function createPasswordHash(password: string) {
    const salt = await getRandomBytesAsync(PASSWORD_SALT_LENGTH);
    const derivedKey = await pbkdf2Async(
        sha256,
        utf8ToBytes(password),
        salt,
        { c: PASSWORD_ITERATIONS, dkLen: PASSWORD_KEY_LENGTH, asyncTick: 50 },
    );

    return [
        PASSWORD_ALGORITHM,
        PASSWORD_ITERATIONS,
        bytesToHex(salt),
        bytesToHex(derivedKey),
    ].join("$");
}

async function verifyPassword(password: string, storedValue: string) {
    const [algorithm, iterationsValue, saltValue, expectedHashValue] = storedValue.split("$");
    const iterations = Number(iterationsValue);

    if (
        algorithm !== PASSWORD_ALGORITHM ||
        !Number.isSafeInteger(iterations) ||
        iterations < 1 || iterations > 1_000_000 ||
        saltValue?.length !== PASSWORD_SALT_LENGTH * 2 ||
        expectedHashValue?.length !== PASSWORD_KEY_LENGTH * 2 ||
        !/^[a-f\d]+$/i.test(saltValue) ||
        !/^[a-f\d]+$/i.test(expectedHashValue)
    ) {
        return false;
    }

    const expectedHash = hexToBytes(expectedHashValue);
    const receivedHash = await pbkdf2Async(
        sha256,
        utf8ToBytes(password),
        hexToBytes(saltValue),
        { c: iterations, dkLen: expectedHash.length, asyncTick: 50 },
    );

    return timingSafeEqual(receivedHash, expectedHash);
}

function timingSafeEqual(received: Uint8Array, expected: Uint8Array) {
    let difference = received.length ^ expected.length;
    const length = Math.max(received.length, expected.length);

    for (let index = 0; index < length; index += 1) {
        difference |= (received[index] ?? 0) ^ (expected[index] ?? 0);
    }

    return difference === 0;
}

async function createAccount<T extends Omit<ApiAccount, "id">>(profile: AuthProfile, account: T) {
    const response = await fetchWithTimeout(endpointFor(profile), {
        body: JSON.stringify(account),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    return parseResponse<T & ApiAccount>(response);
}

async function assignDomainId<T extends ApiAccount>(profile: AuthProfile, account: T) {
    const domainIdField = profile === "cliente" ? "id_familia" : "id_cuidador";
    const response = await fetchWithTimeout(
        `${endpointFor(profile)}/${encodeURIComponent(account.id)}`,
        {
            body: JSON.stringify({ [domainIdField]: account.id }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
        },
    );

    return parseResponse<T>(response);
}

export async function authenticate(
    profile: AuthProfile,
    email: string,
    password: string,
): Promise<AuthenticatedAccount> {
    const account = await findAccountByEmail(profile, email);

    if (!account) {
        throw new AuthServiceError("INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    const validPassword = await verifyPassword(password, account.senha);
    if (!validPassword) {
        throw new AuthServiceError("INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    }

    return {
        email: account.email,
        name: account.nome,
        profile,
        userId: profile === "cliente"
            ? account.id_familia ?? account.id
            : account.id_cuidador ?? account.id,
    };
}

export async function registerClient(input: ClientRegistration) {
    const email = normalizeEmail(input.email);
    if (await findAccountByEmail("cliente", email)) {
        throw new AuthServiceError("DUPLICATE_EMAIL", "Já existe uma conta de cliente com este e-mail.");
    }

    const createdAccount = await createAccount("cliente", {
        criado_em: new Date().toISOString(),
        email,
        nome: input.name.trim(),
        senha: await createPasswordHash(input.password),
        telefone: input.phone.replace(/\D/g, ""),
    });
    const account = await assignDomainId("cliente", createdAccount);

    return {
        email: account.email,
        name: account.nome,
        profile: "cliente" as const,
        userId: account.id_familia ?? account.id,
    };
}

export async function registerProfessional(input: ProfessionalRegistration) {
    const email = normalizeEmail(input.personal.email);
    if (await findAccountByEmail("profissional", email)) {
        throw new AuthServiceError("DUPLICATE_EMAIL", "Já existe uma conta profissional com este e-mail.");
    }

    const createdAccount = await createAccount("profissional", {
        cidade: input.personal.city.trim(),
        criado_em: new Date().toISOString(),
        dias_disponiveis: input.availability.days,
        documentacao_validada: false,
        email,
        endereco: input.personal.address.trim(),
        foto_uri: input.personal.photoUri,
        latitude: null,
        longitude: null,
        nome: input.personal.name.trim(),
        periodos_disponiveis: input.availability.periods,
        raio_atendimento_km: radiusInKm(input.availability.radius),
        senha: await createPasswordHash(input.personal.password),
        status_disponibilidade: input.availability.availableNow
            ? "DISPONIVEL"
            : "INDISPONIVEL",
        telefone: input.personal.phone.replace(/\D/g, ""),
    });
    const account = await assignDomainId("profissional", createdAccount);

    return {
        email: account.email,
        name: account.nome,
        profile: "profissional" as const,
        userId: account.id_cuidador ?? account.id,
    };
}
