/**
 * Valida una Partita IVA italiana (11 cifre, algoritmo Luhn modificato).
 */
export function isValidPartitaIva(pi: string): boolean {
  if (!/^\d{11}$/.test(pi)) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(pi[i], 10);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return sum % 10 === 0;
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
