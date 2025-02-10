class Validators {
  static bool isValidPartitaIva(String value) {
    // Implementazione minima: la partita IVA italiana è di 11 caratteri
    return value.length == 11;
  }
}
