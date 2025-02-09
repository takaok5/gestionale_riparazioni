enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  altro;

  String get display {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }
}

enum StatoRiparazione {
  inAttesa,
  inLavorazione,
  completata,
  consegnata,
  annullata;

  String get display {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return 'In Attesa';
      case StatoRiparazione.inLavorazione:
        return 'In Lavorazione';
      case StatoRiparazione.completata:
        return 'Completata';
      case StatoRiparazione.consegnata:
        return 'Consegnata';
      case StatoRiparazione.annullata:
        return 'Annullata';
    }
  }
}

enum PrioritaRiparazione {
  bassa,
  media,
  alta,
  urgente;

  String get display {
    switch (this) {
      case PrioritaRiparazione.bassa:
        return 'Bassa';
      case PrioritaRiparazione.media:
        return 'Media';
      case PrioritaRiparazione.alta:
        return 'Alta';
      case PrioritaRiparazione.urgente:
        return 'Urgente';
    }
  }
}

enum StatoOrdine { inAttesa, confermato, spedito, consegnato, annullato }

enum TipoCliente { privato, azienda }
