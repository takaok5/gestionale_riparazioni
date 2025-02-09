enum TipoRiparazione {
  // Manteniamo i valori dell'enum originale in riparazione.dart
  smartphone,
  tablet,
  computer,
  console,
  altroDispositivo;

  // Aggiungiamo i metodi dell'enum in tipo_riparazione.dart
  String get displayName {
    switch (this) {
      case TipoRiparazione.smartphone:
        return 'Smartphone';
      case TipoRiparazione.tablet:
        return 'Tablet';
      case TipoRiparazione.computer:
        return 'Computer';
      case TipoRiparazione.console:
        return 'Console';
      case TipoRiparazione.altroDispositivo:
        return 'Altro Dispositivo';
    }
  }
}

enum PrioritaRiparazione { bassa, normale, alta, urgente }

enum StatoOrdine {
  inAttesa,
  confermato,
  spedito,
  consegnato,
  annullato;

  String get display {
    switch (this) {
      case StatoOrdine.inAttesa:
        return 'In Attesa';
      case StatoOrdine.confermato:
        return 'Confermato';
      case StatoOrdine.spedito:
        return 'Spedito';
      case StatoOrdine.consegnato:
        return 'Consegnato';
      case StatoOrdine.annullato:
        return 'Annullato';
    }
  }
}
