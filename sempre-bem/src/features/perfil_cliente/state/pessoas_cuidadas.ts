import { useSyncExternalStore } from 'react';

export type PessoaInput = { name: string; birthDate: string; relationship: string; city: string; health: string };
export type PessoaCuidada = PessoaInput & { id: string; demo?: boolean };
export type PessoaErrors = Partial<Record<keyof PessoaInput, string>>;

export const emptyPessoa: PessoaInput = { name: '', birthDate: '', relationship: '', city: '', health: '' };

export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function validatePessoa(value: PessoaInput, today = new Date()): PessoaErrors {
  const errors: PessoaErrors = {};
  if (value.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Informe o nome completo.';
  const date = parseBirthDate(value.birthDate);
  if (!date || date > today || date.getFullYear() < 1900) errors.birthDate = 'Informe uma data válida, não futura, no formato DD/MM/AAAA.';
  if (!value.relationship.trim()) errors.relationship = 'Informe o parentesco ou vínculo.';
  if (!value.city.trim()) errors.city = 'Informe a cidade e o estado.';
  return errors;
}

export function pessoaAge(person: PessoaCuidada, today = new Date()): number {
  // Mantém a idade ilustrativa do Figma; cadastros locais usam a data real.
  if (person.demo && person.birthDate === '12/04/1947') return 78;
  const birth = parseBirthDate(person.birthDate);
  if (!birth) return 0;
  const beforeBirthday = today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  return today.getFullYear() - birth.getFullYear() - Number(beforeBirthday);
}

// Repositório temporário em memória: substituir por um serviço quando houver API.
let people: PessoaCuidada[] = [{ id: 'maria-demo', demo: true, name: 'Maria Silva', birthDate: '12/04/1947', relationship: 'Mãe', city: 'São Paulo, SP', health: 'Hipertensão · Mobilidade moderada Sem alergias conhecidas' }];
let sequence = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => people;
function publish(next: PessoaCuidada[]) { people = next; listeners.forEach(listener => listener()); }

export const pessoasRepository = {
  save(input: PessoaInput, id?: string): string {
    const errors = validatePessoa(input);
    if (Object.keys(errors).length) throw new Error('Dados da pessoa cuidada inválidos.');
    const normalized = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()])) as PessoaInput;
    if (id) {
      if (!people.some(person => person.id === id)) throw new Error('Pessoa cuidada não encontrada.');
      publish(people.map(person => person.id === id ? { ...person, ...normalized } : person));
      return id;
    }
    const nextId = `local-${++sequence}`;
    publish([...people, { ...normalized, id: nextId }]);
    return nextId;
  },
  remove(id: string) { publish(people.filter(person => person.id !== id)); },
};

export function usePessoasCuidadas() { return useSyncExternalStore(subscribe, snapshot, snapshot); }
