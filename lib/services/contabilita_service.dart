import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/riparazione.dart';
import '../models/stato_riparazione.dart';

class ContabilitaService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<Map<String, dynamic>> getReportContabilita(
    DateTime startDate,
    DateTime endDate,
  ) {
    return _firestore
        .collection('riparazioni')
        .where('dataIngresso', isGreaterThanOrEqualTo: startDate)
        .where('dataIngresso', isLessThanOrEqualTo: endDate)
        .snapshots()
        .map((snapshot) {
      double totaleIncassi = 0;
      double totaleCosti = 0;
      int riparazioniCompletate = 0;
      int riparazioniInCorso = 0;

      for (var doc in snapshot.docs) {
        final riparazione = Riparazione.fromMap({...doc.data(), 'id': doc.id});

        if (riparazione.stato == StatoRiparazione.completata ||
            riparazione.stato == StatoRiparazione.consegnata) {
          totaleIncassi += riparazione.prezzoTotale;
          totaleCosti += riparazione.costoRicambi;
          riparazioniCompletate++;
        } else if (riparazione.stato == StatoRiparazione.inLavorazione) {
          riparazioniInCorso++;
        }
      }

      return {
        'totaleIncassi': totaleIncassi,
        'totaleCosti': totaleCosti,
        'margine': totaleIncassi - totaleCosti,
        'riparazioniCompletate': riparazioniCompletate,
        'riparazioniInCorso': riparazioniInCorso,
        'margineMedio': riparazioniCompletate > 0
            ? (totaleIncassi - totaleCosti) / riparazioniCompletate
            : 0,
      };
    });
  }
}
