export function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
