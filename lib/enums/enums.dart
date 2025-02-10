import 'package:flutter/material.dart';

enum TipoMovimento { carico, scarico, reso, scarto }

enum UserRole { admin, manager, tecnico, receptionist, user }

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
  rifiutata
}

extension StatoRiparazioneExtension on StatoRiparazione {
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

  IconData get icon {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return Icons.hourglass_empty;
      case StatoRiparazione.diagnostica:
        return Icons.search;
      case StatoRiparazione.attesaPezzi:
        return Icons.inventory;
      case StatoRiparazione.inLavorazione:
        return Icons.build;
      case StatoRiparazione.inPausa:
        return Icons.pause_circle;
      case StatoRiparazione.completata:
        return Icons.check_circle;
      case StatoRiparazione.daTestare:
        return Icons.rule;
      case StatoRiparazione.pronta:
        return Icons.done_all;
      case StatoRiparazione.consegnata:
        return Icons.local_shipping;
      case StatoRiparazione.annullata:
        return Icons.cancel;
      case StatoRiparazione.rifiutata:
        return Icons.block;
    }
  }

  Color get color {
    switch (this) {
      case StatoRiparazione.inAttesa:
        return Colors.orange;
      case StatoRiparazione.diagnostica:
        return Colors.blue;
      case StatoRiparazione.attesaPezzi:
        return Colors.red;
      case StatoRiparazione.inLavorazione:
        return Colors.purple;
      case StatoRiparazione.inPausa:
        return Colors.blueGrey;
      case StatoRiparazione.completata:
        return Colors.green;
      case StatoRiparazione.daTestare:
        return Colors.yellow;
      case StatoRiparazione.pronta:
        return Colors.teal;
      case StatoRiparazione.consegnata:
        return Colors.lightGreen;
      case StatoRiparazione.annullata:
        return Colors.red;
      case StatoRiparazione.rifiutata:
        return Colors.red[700]!;
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

// Stato dell'accessorio
enum StatoAccessorio {
  presente,
  assente,
  danneggiato;

  String get label {
    switch (this) {
      case StatoAccessorio.presente:
        return 'Presente';
      case StatoAccessorio.assente:
        return 'Assente';
      case StatoAccessorio.danneggiato:
        return 'Danneggiato';
    }
  }
}

// Tipo di riparazione
enum TipoRiparazione {
  smartphone,
  tablet,
  computer,
  console,
  altroDispositivo;

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

// Priorità della riparazione
enum PrioritaRiparazione {
  bassa,
  media,
  alta,
  urgente;

  String get label {
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

// Stato del cliente
enum StatoCliente {
  attivo,
  inattivo,
  sospeso,
  cancellato;

  String get label {
    switch (this) {
      case StatoCliente.attivo:
        return 'Attivo';
      case StatoCliente.inattivo:
        return 'Inattivo';
      case StatoCliente.sospeso:
        return 'Sospeso';
      case StatoCliente.cancellato:
        return 'Cancellato';
    }
  }
}

// Stato del tecnico
enum StatoTecnico {
  attivo,
  inattivo,
  ferie,
  malattia,
  sospeso;

  String get label {
    switch (this) {
      case StatoTecnico.attivo:
        return 'Attivo';
      case StatoTecnico.inattivo:
        return 'Inattivo';
      case StatoTecnico.ferie:
        return 'In Ferie';
      case StatoTecnico.malattia:
        return 'In Malattia';
      case StatoTecnico.sospeso:
        return 'Sospeso';
    }
  }
}

// Livello di certificazione
enum LivelloCertificazione {
  junior,
  intermediate,
  senior,
  expert;

  String get label {
    switch (this) {
      case LivelloCertificazione.junior:
        return 'Junior';
      case LivelloCertificazione.intermediate:
        return 'Intermediate';
      case LivelloCertificazione.senior:
        return 'Senior';
      case LivelloCertificazione.expert:
        return 'Expert';
    }
  }
}

// Stato dell'ordine
enum StatoOrdine {
  inAttesa,
  inLavorazione,
  completato,
  annullato,
  inSospeso;

  String get label {
    switch (this) {
      case StatoOrdine.inAttesa:
        return 'In Attesa';
      case StatoOrdine.inLavorazione:
        return 'In Lavorazione';
      case StatoOrdine.completato:
        return 'Completato';
      case StatoOrdine.annullato:
        return 'Annullato';
      case StatoOrdine.inSospeso:
        return 'In Sospeso';
    }
  }
}

enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  laptop,
  desktop,
  console,
  smartwatch,
  auricolari,
  stampante,
  monitor,
  router,
  televisore,
  fotocamera,
  audioHifi,
  droni,
  altro;

  String get label {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer';
      case TipoDispositivo.laptop:
        return 'Laptop';
      case TipoDispositivo.desktop:
        return 'Desktop';
      case TipoDispositivo.console:
        return 'Console';
      case TipoDispositivo.smartwatch:
        return 'Smartwatch';
      case TipoDispositivo.auricolari:
        return 'Auricolari';
      case TipoDispositivo.stampante:
        return 'Stampante';
      case TipoDispositivo.monitor:
        return 'Monitor';
      case TipoDispositivo.router:
        return 'Router';
      case TipoDispositivo.televisore:
        return 'Televisore';
      case TipoDispositivo.fotocamera:
        return 'Fotocamera';
      case TipoDispositivo.audioHifi:
        return 'Audio Hi-Fi';
      case TipoDispositivo.droni:
        return 'Droni';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }

  String get icon {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'smartphone';
      case TipoDispositivo.tablet:
        return 'tablet';
      case TipoDispositivo.computer:
        return 'computer';
      case TipoDispositivo.laptop:
        return 'laptop';
      case TipoDispositivo.desktop:
        return 'desktop';
      case TipoDispositivo.console:
        return 'videogame_asset';
      case TipoDispositivo.smartwatch:
        return 'watch';
      case TipoDispositivo.auricolari:
        return 'headphones';
      case TipoDispositivo.stampante:
        return 'print';
      case TipoDispositivo.monitor:
        return 'monitor';
      case TipoDispositivo.router:
        return 'router';
      case TipoDispositivo.televisore:
        return 'tv';
      case TipoDispositivo.fotocamera:
        return 'camera_alt';
      case TipoDispositivo.audioHifi:
        return 'speaker';
      case TipoDispositivo.droni:
        return 'airplanemode_active';
      case TipoDispositivo.altro:
        return 'devices_other';
    }
  }

  bool get requiresSerialNumber {
    switch (this) {
      case TipoDispositivo.smartphone:
      case TipoDispositivo.tablet:
      case TipoDispositivo.computer:
      case TipoDispositivo.laptop:
      case TipoDispositivo.desktop:
      case TipoDispositivo.console:
      case TipoDispositivo.fotocamera:
        return true;
      default:
        return false;
    }
  }
}

// Aggiungi questi enum
enum StatoAppuntamento {
  programmato,
  confermato,
  inCorso,
  completato,
  annullato,
  nonPresentato;

  String get label {
    switch (this) {
      case StatoAppuntamento.programmato:
        return 'Programmato';
      case StatoAppuntamento.confermato:
        return 'Confermato';
      case StatoAppuntamento.inCorso:
        return 'In Corso';
      case StatoAppuntamento.completato:
        return 'Completato';
      case StatoAppuntamento.annullato:
        return 'Annullato';
      case StatoAppuntamento.nonPresentato:
        return 'Non Presentato';
    }
  }
}

enum TipoAppuntamento {
  generico,
  riparazione,
  consulenza,
  sopralluogo,
  consegna;

  String get label {
    switch (this) {
      case TipoAppuntamento.generico:
        return 'Generico';
      case TipoAppuntamento.riparazione:
        return 'Riparazione';
      case TipoAppuntamento.consulenza:
        return 'Consulenza';
      case TipoAppuntamento.sopralluogo:
        return 'Sopralluogo';
      case TipoAppuntamento.consegna:
        return 'Consegna';
    }
  }
}

enum TipoCliente {
  privato,
  azienda,
  pubblicaAmministrazione,
  altro,
}

/// Stato possibile di una garanzia
enum StatoGaranzia { attiva, scaduta, invalidata }

/// Tipo di garanzia
enum TipoGaranzia { interna, fornitore }
