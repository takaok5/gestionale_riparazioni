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
    }
  }
}
