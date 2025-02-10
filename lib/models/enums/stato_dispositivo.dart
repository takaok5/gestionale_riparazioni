enum StatoDispositivo {
  nuovo,
  usato,
  danneggiato,
  nonFunzionante,
  inRiparazione,
  riparato,
  daSmaltire
}

extension StatoDispositivoExtension on StatoDispositivo {
  String get label {
    switch (this) {
      case StatoDispositivo.nuovo:
        return 'Nuovo';
      case StatoDispositivo.usato:
        return 'Usato';
      case StatoDispositivo.danneggiato:
        return 'Danneggiato';
      case StatoDispositivo.nonFunzionante:
        return 'Non Funzionante';
      case StatoDispositivo.inRiparazione:
        return 'In Riparazione';
      case StatoDispositivo.riparato:
        return 'Riparato';
      case StatoDispositivo.daSmaltire:
        return 'Da Smaltire';
    }
  }
}