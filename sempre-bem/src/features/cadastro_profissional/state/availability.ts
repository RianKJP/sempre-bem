import { useSyncExternalStore } from 'react';

export const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
export const periods = ['Manhã (07h–12h)', 'Tarde (13h–18h)', 'Integral (07h–18h)', 'Noturno (18h–07h)'] as const;
export type Day = typeof weekDays[number];
export type Period = typeof periods[number];
export type Availability = { days: Day[]; periods: Period[]; availableNow: boolean; radius: string };
export type AvailabilityErrors = Partial<Record<'days' | 'periods' | 'radius', string>>;

export function radiusInKm(value: string): number {
  const normalized = value.trim().replace(/^at[eé]\s+/i, '').replace(/\s*km$/i, '').trim().replace(',', '.');
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
export function validateAvailability(value: Availability): AvailabilityErrors {
  const errors: AvailabilityErrors = {};
  if (!value.days.length || value.days.some(day => !weekDays.includes(day))) errors.days = 'Selecione pelo menos um dia disponível.';
  if (!value.periods.length || value.periods.some(period => !periods.includes(period))) errors.periods = 'Selecione pelo menos um horário.';
  const radius = radiusInKm(value.radius);
  if (!Number.isFinite(radius) || radius <= 0) errors.radius = 'Informe um raio maior que zero, em km.';
  return errors;
}

// Rascunho local: nenhuma solicitação é recebida pelo estado disponível agora.
let draft: Availability = { days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], periods: [periods[0], periods[1]], availableNow: true, radius: '' };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => draft;
export function updateAvailability(value: Availability) { draft = { ...value, days: [...value.days], periods: [...value.periods] }; listeners.forEach(listener => listener()); }
export function resetAvailabilityDraft() { updateAvailability({ days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'], periods: [periods[0], periods[1]], availableNow: true, radius: '' }); }
export function useAvailabilityDraft() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
