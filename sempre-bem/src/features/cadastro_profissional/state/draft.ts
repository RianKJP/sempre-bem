import { useSyncExternalStore } from 'react';

export type PersonalData = { name: string; phone: string; email: string; city: string; address: string; password: string; confirmation: string; photoUri: string | null };
export type PersonalErrors = Partial<Record<Exclude<keyof PersonalData, 'photoUri'>, string>>;
export const initialPersonal: PersonalData = { name: '', phone: '', email: '', city: '', address: '', password: '', confirmation: '', photoUri: null };

export function validatePersonal(value: PersonalData): PersonalErrors {
  const errors: PersonalErrors = {};
  if (value.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Informe seu nome completo.';
  if (!/^\d{10,11}$/.test(value.phone.replace(/\D/g, ''))) errors.phone = 'Informe o telefone com DDD (10 ou 11 dígitos).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (!value.city.trim()) errors.city = 'Informe sua cidade.';
  if (!value.address.trim()) errors.address = 'Informe seu endereço.';
  if (value.password.length < 8) errors.password = 'Use pelo menos 8 caracteres.';
  if (!value.confirmation || value.confirmation !== value.password) errors.confirmation = 'As senhas devem ser iguais.';
  return errors;
}

// Rascunho somente em memória, separado dos dados do cliente e sem persistência.
let personal = initialPersonal;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => personal;
export function updatePersonal(value: PersonalData) { personal = { ...value }; listeners.forEach(listener => listener()); }
export function resetPersonalDraft() { updatePersonal(initialPersonal); }
export function usePersonalDraft() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
