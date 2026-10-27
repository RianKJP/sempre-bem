export const BRAZILIAN_PHONE_MAX_LENGTH = 15;

export function formatBrazilianPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;

    const areaCode = digits.slice(0, 2);
    const subscriber = digits.slice(2);

    if (subscriber.length <= 4) return `(${areaCode}) ${subscriber}`;

    const prefixLength = subscriber.length <= 8 ? 4 : 5;
    return `(${areaCode}) ${subscriber.slice(0, prefixLength)}-${subscriber.slice(prefixLength)}`;
}
