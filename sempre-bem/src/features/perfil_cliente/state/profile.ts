import { useState } from 'react';

export type ClienteProfile = { id: string; name: string; email: string };
export type ClienteProfileInput = Pick<ClienteProfile, 'name' | 'email'>;
export type ProfileErrors = Partial<Record<keyof ClienteProfileInput, string>>;

// Dados demonstrativos do Figma. Substituir pelo usuário carregado no CRUD.
const previewProfile: ClienteProfile = { id: 'figma-preview', name: 'Ana Rodrigues', email: 'ana@email.com' };

export function validateProfile(input: ClienteProfileInput): ProfileErrors {
  const errors: ProfileErrors = {};
  if (input.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Informe seu nome completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Informe um e-mail válido.';
  return errors;
}

// Estado limitado à tela: não grava dados nem representa uma operação de backend.
export function useClienteProfile() {
  const [profile, setProfile] = useState<ClienteProfile>(previewProfile);
  function updateProfile(input: ClienteProfileInput) {
    setProfile(previous => ({ ...previous, name: input.name.trim(), email: input.email.trim() }));
  }
  return { profile, updateProfile };
}
