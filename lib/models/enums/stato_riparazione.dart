enum StatoRiparazione {
  inAttesa,
  diagnostica,
  attesaPezzi,
  inLavorazione,
  inPausa,
  completata,
  daTestare,
  pronta,
  consegnata,
  annullata,
  rifiutata;

  String get label {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return 'In Attesa';
      case StatoRiparazione.diagnostica:
        return 'In Diagnostica';
      case StatoRiparazione.attesaPezzi:
        return 'In Attesa Pezzi';
      case StatoRiparazione.inLavorazione:
        return 'In Lavorazione';
      case StatoRiparazione.inPausa:
        return 'In Pausa';
      case StatoRiparazione.completata:
        return 'Completata';
      case StatoRiparazione.daTestare:
        return 'Da Testare';
      case StatoRiparazione.pronta:
        return 'Pronta';
      case StatoRiparazione.consegnata:
        return 'Consegnata';
      case StatoRiparazione.annullata:
        return 'Annullata';
      case StatoRiparazione.rifiutata:
        return 'Rifiutata';
    }
  }

  String get icon {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return 'hourglass_empty';
      case StatoRiparazione.diagnostica:
        return 'search';
      case StatoRiparazione.attesaPezzi:
        return 'inventory';
      case StatoRiparazione.inLavorazione:
        return 'build';
      case StatoRiparazione.inPausa:
        return 'pause_circle';
      case StatoRiparazione.completata:
        return 'check_circle';
      case StatoRiparazione.daTestare:
        return 'rule';
      case StatoRiparazione.pronta:
        return 'done_all';
      case StatoRiparazione.consegnata:
        return 'local_shipping';
      case StatoRiparazione.annullata:
        return 'cancel';
      case StatoRiparazione.rifiutata:
        return 'block';
    }
  }

  String get color {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return '#FFA726'; // Orange
      case StatoRiparazione.diagnostica:
        return '#42A5F5'; // Blue
      case StatoRiparazione.attesaPezzi:
        return '#EF5350'; // Red
      case StatoRiparazione.inLavorazione:
        return '#AB47BC'; // Purple
      case StatoRiparazione.inPausa:
        return '#78909C'; // Blue Grey
      case StatoRiparazione.completata:
        return '#66BB6A'; // Green
      case StatoRiparazione.daTestare:
        return '#FDD835'; // Yellow
      case StatoRiparazione.pronta:
        return '#26A69A'; // Teal
      case StatoRiparazione.consegnata:
        return '#9CCC65'; // Light Green
      case StatoRiparazione.annullata:
        return '#E53935'; // Red
      case StatoRiparazione.rifiutata:
        return '#D32F2F'; // Dark Red
    }
  }

  bool get isStatoFinale {
    return this == StatoRiparazione.consegnata ||
        this == StatoRiparazione.annullata ||
        this == StatoRiparazione.rifiutata;
  }

  bool get richiedeAzione {
    return this == StatoRiparazione.inAttesa ||
        this == StatoRiparazione.attesaPezzi ||
        this == StatoRiparazione.daTestare ||
        this == StatoRiparazione.pronta;
  }

  bool get inCorso {
    return this == StatoRiparazione.inLavorazione ||
        this == StatoRiparazione.diagnostica;
  }

  List<StatoRiparazione> get statoSuccessivoPossibile {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return [
          StatoRiparazione.diagnostica,
          StatoRiparazione.inLavorazione,
          StatoRiparazione.annullata
        ];
      case StatoRiparazione.diagnostica:
        return [
          StatoRiparazione.inLavorazione,
          StatoRiparazione.attesaPezzi,
          StatoRiparazione.rifiutata
        ];
      case StatoRiparazione.attesaPezzi:
        return [StatoRiparazione.inLavorazione, StatoRiparazione.annullata];
      case StatoRiparazione.inLavorazione:
        return [
          StatoRiparazione.inPausa,
          StatoRiparazione.completata,
          StatoRiparazione.daTestare
        ];
      case StatoRiparazione.inPausa:
        return [StatoRiparazione.inLavorazione, StatoRiparazione.annullata];
      case StatoRiparazione.completata:
        return [StatoRiparazione.daTestare, StatoRiparazione.pronta];
      case StatoRiparazione.daTestare:
        return [StatoRiparazione.pronta, StatoRiparazione.inLavorazione];
      case StatoRiparazione.pronta:
        return [StatoRiparazione.consegnata];
      case StatoRiparazione.consegnata:
      case StatoRiparazione.annullata:
      case StatoRiparazione.rifiutata:
        return [];
    }
  }
}
