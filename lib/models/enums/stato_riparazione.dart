import 'package:flutter/material.dart';

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
