/**
 * Valida una Partita IVA italiana come stringa numerica di 11 cifre.
 */
export function isValidPartitaIva(pi: string): boolean {
  return /^\d{11}$/.test(pi);
}

/**
 * Valida un Codice Fiscale italiano (16 caratteri alfanumerici).
 * Validazione di formato base, non algoritmica completa.
 */
export function isValidCodiceFiscale(cf: string): boolean {
  const pattern = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i;
  return pattern.test(cf);
}

/**
 * Valida un CAP italiano (5 cifre).
 */
export function isValidCAP(cap: string): boolean {
  return /^\d{5}$/.test(cap);
}

/**
 * Valida una sigla provincia italiana (2 lettere maiuscole).
 */
export function isValidProvincia(provincia: string): boolean {
  return /^[A-Z]{2}$/i.test(provincia);
}
