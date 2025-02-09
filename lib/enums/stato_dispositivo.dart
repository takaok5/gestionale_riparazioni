enum StatoDispositivo {
  funzionante,
  malfunzionante,
  inRiparazione,
  irreparabile,
  dismesso,
  inAttesa,
  daVerificare; // Note the semicolon here before the method

  /// Ottiene una descrizione leggibile dello stato
  String get descrizione {
    switch (this) {
      case StatoDispositivo.funzionante:
        return 'Funzionante';
      case StatoDispositivo.malfunzionante:
        return 'Malfunzionante';
      case StatoDispositivo.inRiparazione:
        return 'In Riparazione';
      case StatoDispositivo.irreparabile:
        return 'Irreparabile';
      case StatoDispositivo.dismesso:
        return 'Dismesso';
      case StatoDispositivo.inAttesa:
        return 'In Attesa';
      case StatoDispositivo.daVerificare:
        return 'Da Verificare';
    }
  }
}
