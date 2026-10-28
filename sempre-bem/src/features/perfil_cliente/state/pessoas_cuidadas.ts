import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { CLIENT_API_ENDPOINTS } from '@/features/app_cliente/config/api_config';

export type PessoaInput = {
  allergies: string;
  birthDate: string;
  emergencyContact: string;
  health: string;
  mobility: string;
  name: string;
  notes: string;
  relationship: string;
  restrictions: string;
  sex: string;
};
export type PessoaCuidada = PessoaInput & { id: string };
export type PessoaErrors = Partial<Record<keyof PessoaInput, string>>;

export const emptyPessoa: PessoaInput = {
  allergies: '',
  birthDate: '',
  emergencyContact: '',
  health: '',
  mobility: '',
  name: '',
  notes: '',
  relationship: '',
  restrictions: '',
  sex: '',
};

export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatEmergencyPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validatePessoa(value: PessoaInput, today = new Date()): PessoaErrors {
  const errors: PessoaErrors = {};
  if (value.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Informe o nome completo.';
  const date = parseBirthDate(value.birthDate);
  if (!date || date > today || date.getFullYear() < 1900) errors.birthDate = 'Informe uma data válida, não futura, no formato DD/MM/AAAA.';
  if (!value.relationship.trim()) errors.relationship = 'Informe o parentesco ou vínculo.';
  const emergencyPhone = value.emergencyContact.replace(/\D/g, '');
  if (emergencyPhone && !/^\d{10,11}$/.test(emergencyPhone)) {
    errors.emergencyContact = 'Informe um telefone com DDD e 10 ou 11 dígitos.';
  }
  return errors;
}

export function pessoaAge(person: PessoaCuidada, today = new Date()): number {
  const birth = parseBirthDate(person.birthDate);
  if (!birth) return 0;
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return today.getFullYear() - birth.getFullYear() - Number(beforeBirthday);
}

type IdosoApi = {
  alergias?: string | null;
  condicoes_saude?: string | null;
  contato_emergencia?: string | null;
  data_nascimento: string;
  id: string;
  id_familia: string;
  id_idoso?: string;
  mobilidade?: string | null;
  nome: string;
  observacoes?: string | null;
  relacao?: string | null;
  restricoes?: string | null;
  sexo?: string | null;
};

function toDisplayDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function toApiDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function mapApiPerson(value: IdosoApi): PessoaCuidada {
  return {
    allergies: value.alergias ?? '',
    birthDate: toDisplayDate(value.data_nascimento),
    emergencyContact: formatEmergencyPhone(value.contato_emergencia ?? ''),
    health: value.condicoes_saude ?? '',
    id: value.id,
    mobility: value.mobilidade ?? '',
    name: value.nome,
    notes: value.observacoes ?? '',
    relationship: value.relacao ?? 'Familiar',
    restrictions: value.restricoes ?? '',
    sex: value.sexo ?? '',
  };
}

function toApiPerson(input: PessoaInput, familyId: string, personId: string) {
  return {
    alergias: input.allergies.trim() || null,
    condicoes_saude: input.health.trim() || null,
    contato_emergencia: input.emergencyContact.replace(/\D/g, '') || null,
    data_nascimento: toApiDate(input.birthDate),
    id_familia: familyId,
    id_idoso: personId,
    mobilidade: input.mobility.trim() || null,
    nome: input.name.trim(),
    observacoes: input.notes.trim() || null,
    relacao: input.relationship.trim(),
    restricoes: input.restrictions.trim() || null,
    sexo: input.sex.trim() || null,
  };
}

export const pessoasRepository = {
  async list(familyId: string, signal?: AbortSignal): Promise<PessoaCuidada[]> {
    const response = await fetch(CLIENT_API_ENDPOINTS.idososDaFamilia(familyId), { signal });
    if (!response.ok) throw new Error('Não foi possível carregar as pessoas cuidadas.');
    const data = await response.json() as IdosoApi[];
    return data.map(mapApiPerson);
  },
  async save(input: PessoaInput, familyId: string, id?: string): Promise<string> {
    const errors = validatePessoa(input);
    if (Object.keys(errors).length) throw new Error('Dados da pessoa cuidada inválidos.');
    const personId = id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const response = await fetch(
      id ? CLIENT_API_ENDPOINTS.idoso(id) : CLIENT_API_ENDPOINTS.idosos,
      {
        body: JSON.stringify({
          ...toApiPerson(input, familyId, personId),
          ...(!id ? { id: personId } : {}),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: id ? 'PATCH' : 'POST',
      },
    );
    if (!response.ok) throw new Error('Não foi possível salvar a pessoa cuidada.');
    return personId;
  },
  async remove(id: string): Promise<void> {
    const response = await fetch(CLIENT_API_ENDPOINTS.idoso(id), { method: 'DELETE' });
    if (!response.ok) throw new Error('Não foi possível excluir a pessoa cuidada.');
  },
};

export function usePessoasCuidadas(familyId: string) {
  const [people, setPeople] = useState<PessoaCuidada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    void pessoasRepository.list(familyId, controller.signal)
      .then(setPeople)
      .catch((failure: unknown) => {
        if (failure instanceof Error && failure.name === 'AbortError') return;
        setError(failure instanceof Error ? failure.message : 'Não foi possível carregar as pessoas cuidadas.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [familyId, reloadKey]));

  return {
    error,
    loading,
    people,
    reload: () => setReloadKey(value => value + 1),
  };
}
