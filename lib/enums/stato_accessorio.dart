enum StatoAccessorio {
  presente,
  mancante,
  danneggiato,
  daVerificare,
  nonNecessario; // Note the semicolon here before the method

  /// Ottiene una descrizione leggibile dello stato
  String get descrizione {
    switch (this) {
      case StatoAccessorio.presente:
        return 'Presente';
      case StatoAccessorio.mancante:
        return 'Mancante';
      case StatoAccessorio.danneggiato:
        return 'Danneggiato';
      case StatoAccessorio.daVerificare:
        return 'Da Verificare';
      case StatoAccessorio.nonNecessario:
        return 'Non Necessario';
    }
  }

  /// Controlla se l'accessorio richiede attenzione
  bool get requiresAttention =>
      this == StatoAccessorio.mancante ||
      this == StatoAccessorio.danneggiato ||
      this == StatoAccessorio.daVerificare;
}
