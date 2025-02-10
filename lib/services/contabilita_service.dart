import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/riparazione.dart';
import '../models/stato_riparazione.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class ContabilitaService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Cache per i report
  final Map<String, Map<String, dynamic>> _reportCache = {};
  static const Duration _cacheDuration = Duration(minutes: 15);

  Stream<Map<String, dynamic>> getReportContabilita(
    DateTime startDate,
    DateTime endDate,
  ) {
    // Converti le date in UTC per Firestore
    final startUtc = AppDateUtils.toUtc(startDate);
    final endUtc = AppDateUtils.toUtc(endDate);
    
    return _firestore
        .collection('riparazioni')
        .where('dataIngresso', isGreaterThanOrEqualTo: startUtc)
        .where('dataIngresso', isLessThanOrEqualTo: endUtc)
        .snapshots()
        .map((snapshot) => _processReportData(snapshot, startDate, endDate));
  }

  Map<String, dynamic> _processReportData(
    QuerySnapshot snapshot,
    DateTime startDate,
    DateTime endDate,
  ) {
    double totaleIncassi = 0;
    double totaleCosti = 0;
    int riparazioniCompletate = 0;
    int riparazioniInCorso = 0;
    Map<String, double> incassiGiornalieri = {};
    Map<String, int> riparazioniPerGiorno = {};

    for (var doc in snapshot.docs) {
      final riparazione = Riparazione.fromMap({...doc.data(), 'id': doc.id});
      final dataIngresso = (riparazione.dataIngresso as Timestamp).toDate();
      final giornoFormattato = AppDateUtils.formatDate(dataIngresso);

      // Aggiorna conteggi giornalieri
      riparazioniPerGiorno[giornoFormattato] = 
          (riparazioniPerGiorno[giornoFormattato] ?? 0) + 1;

      if (riparazione.stato == StatoRiparazione.completata ||
          riparazione.stato == StatoRiparazione.consegnata) {
        totaleIncassi += riparazione.prezzoTotale;
        totaleCosti += riparazione.costoRicambi;
        riparazioniCompletate++;
        
        incassiGiornalieri[giornoFormattato] = 
            (incassiGiornalieri[giornoFormattato] ?? 0) + riparazione.prezzoTotale;
      } else if (riparazione.stato == StatoRiparazione.inLavorazione) {
        riparazioniInCorso++;
      }
    }

    final periodoDays = AppDateUtils.daysBetween(startDate, endDate);
    final mediaGiornaliera = periodoDays > 0 ? totaleIncassi / periodoDays : 0;

    return {
      'totaleIncassi': totaleIncassi,
      'totaleCosti': totaleCosti,
      'margine': totaleIncassi - totaleCosti,
      'riparazioniCompletate': riparazioniCompletate,
      'riparazioniInCorso': riparazioniInCorso,
      'margineMedio': riparazioniCompletate > 0
          ? (totaleIncassi - totaleCosti) / riparazioniCompletate
          : 0,
      'periodoReport': {
        'inizio': AppDateUtils.formatDateTime(startDate),
        'fine': AppDateUtils.formatDateTime(endDate),
        'giorni': periodoDays,
      },
      'statisticheGiornaliere': {
        'incassi': incassiGiornalieri,
        'riparazioni': riparazioniPerGiorno,
        'mediaIncassi': mediaGiornaliera,
      },
      'timestampReport': AppDateUtils.formatDateTime(AppDateUtils.getCurrentDateTime()),
    };
  }

  // Nuovo metodo per report mensile
  Future<Map<String, dynamic>> getReportMensile(DateTime mese) async {
    final inizioMese = AppDateUtils.startOfMonth(mese);
    final fineMese = AppDateUtils.endOfMonth(mese);
    final meseFormattato = AppDateUtils.formatYearMonth(mese);
    
    // Controlla cache
    if (_reportCache.containsKey(meseFormattato)) {
      final cached = _reportCache[meseFormattato]!;
      final timestampCache = DateTime.parse(cached['timestampReport']);
      if (AppDateUtils.getCurrentDateTime().difference(timestampCache) < _cacheDuration) {
        return cached;
      }
    }

    final report = await getReportContabilita(inizioMese, fineMese).first;
    _reportCache[meseFormattato] = report;
    return report;
  }

  // Nuovo metodo per confronto periodi
  Future<Map<String, dynamic>> confrontaPeriodi(
    DateTime inizioPeriodo1,
    DateTime finePeriodo1,
    DateTime inizioPeriodo2,
    DateTime finePeriodo2,
  ) async {
    final report1 = await getReportContabilita(inizioPeriodo1, finePeriodo1).first;
    final report2 = await getReportContabilita(inizioPeriodo2, finePeriodo2).first;

    final giorni1 = AppDateUtils.daysBetween(inizioPeriodo1, finePeriodo1);
    final giorni2 = AppDateUtils.daysBetween(inizioPeriodo2, finePeriodo2);

    return {
      'periodo1': {
        'inizio': AppDateUtils.formatDateTime(inizioPeriodo1),
        'fine': AppDateUtils.formatDateTime(finePeriodo1),
        'giorni': giorni1,
        ...report1,
      },
      'periodo2': {
        'inizio': AppDateUtils.formatDateTime(inizioPeriodo2),
        'fine': AppDateUtils.formatDateTime(finePeriodo2),
        'giorni': giorni2,
        ...report2,
      },
      'confronto': {
        'differenzaIncassi': report2['totaleIncassi'] - report1['totaleIncassi'],
        'differenzaMargine': report2['margine'] - report1['margine'],
        'crescitaPercentuale': report1['totaleIncassi'] > 0
            ? ((report2['totaleIncassi'] - report1['totaleIncassi']) / 
               report1['totaleIncassi'] * 100).toStringAsFixed(2) + '%'
            : 'N/A',
        'mediaGiornalieraPeriodo1': giorni1 > 0 
            ? report1['totaleIncassi'] / giorni1 
            : 0,
        'mediaGiornalieraPeriodo2': giorni2 > 0 
            ? report2['totaleIncassi'] / giorni2 
            : 0,
      },
      'generatoIl': AppDateUtils.formatDateTime(AppDateUtils.getCurrentDateTime()),
    };
  }
}