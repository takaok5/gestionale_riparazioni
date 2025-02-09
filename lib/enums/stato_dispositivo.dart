enum StatoDispositivo {
  inAttesa,
  inLavorazione,
  inAttesaRicambi,
  completato,
  consegnato,
  annullato,
  nuovo,
  usato,
  funzionante,
  danneggiato,
  riparato,
  nonRiparabile;

  String get label {
    switch (this) {
      case StatoDispositivo.inAttesa:
        return 'In Attesa';
      case StatoDispositivo.inLavorazione:
        return 'In Lavorazione';
      case StatoDispositivo.inAttesaRicambi:
        return 'In Attesa Ricambi';
      case StatoDispositivo.completato:
        return 'Completato';
      case StatoDispositivo.consegnato:
        return 'Consegnato';
      case StatoDispositivo.annullato:
        return 'Annullato';
      case StatoDispositivo.nuovo:
        return 'Nuovo';
      case StatoDispositivo.usato:
        return 'Usato';
      case StatoDispositivo.funzionante:
        return 'Funzionante';
      case StatoDispositivo.danneggiato:
        return 'Danneggiato';
      case StatoDispositivo.riparato:
        return 'Riparato';
      case StatoDispositivo.nonRiparabile:
        return 'Non Riparabile';
    }
  }
}
