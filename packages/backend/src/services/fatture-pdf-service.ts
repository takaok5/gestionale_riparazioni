function createFatturaPdfPath(numeroFattura: string, fatturaId: number): string {
  const safeNumero = numeroFattura.replace("/", "-");
  return `/generated/fatture/${safeNumero}-${fatturaId}.pdf`;
}

export { createFatturaPdfPath };
