import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/riparazione.dart';
import '../models/feedback_cliente.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import 'enums/enums.dart';

class AnalyticsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<Map<String, dynamic>> getStatisticheMensili(int anno, int mese) async {
    // Utilizzo di AppDateUtils per gestire le date di inizio e fine mese
    final inizioMese = AppDateUtils.getFirstDayOfMonth(anno, mese);
    final fineMese = AppDateUtils.getLastDayOfMonth(anno, mese);

    final riparazioni = await _db
        .collection('riparazioni')
        .where('dataIngresso',
            isGreaterThanOrEqualTo: AppDateUtils.toUtc(inizioMese))
        .where('dataIngresso',
            isLessThanOrEqualTo: AppDateUtils.toUtc(fineMese))
        .get();

    final preventivi = await _db
        .collection('preventivi')
        .where('data', isGreaterThanOrEqualTo: AppDateUtils.toUtc(inizioMese))
        .where('data', isLessThanOrEqualTo: AppDateUtils.toUtc(fineMese))
        .get();

    int totaleRiparazioni = riparazioni.docs.length;
    int preventiviAccettati = 0;
    double fatturato = 0;
    Map<String, int> tipiDispositivi = {};
    double tempoMedioRiparazione = 0;

    for (var doc in preventivi.docs) {
      if (doc.data()['accettato'] == true) {
        preventiviAccettati++;
      }
    }

    for (var doc in riparazioni.docs) {
      final riparazione = Riparazione.fromMap(doc.data());
      fatturato += riparazione.costoFinale ?? 0;

      tipiDispositivi.update(
        riparazione.tipo,
        (value) => value + 1,
        ifAbsent: () => 1,
      );

      if (riparazione.dataUscita != null) {
        // Utilizzo di AppDateUtils per calcolare la differenza in ore
        tempoMedioRiparazione += AppDateUtils.hoursBetween(
            riparazione.dataIngresso, riparazione.dataUscita!);
      }
    }

    if (totaleRiparazioni > 0) {
      tempoMedioRiparazione /= totaleRiparazioni;
    }

    return {
      'periodo': {
        'inizio': AppDateUtils.formatDate(inizioMese),
        'fine': AppDateUtils.formatDate(fineMese),
      },
      'totaleRiparazioni': totaleRiparazioni,
      'preventiviAccettati': preventiviAccettati,
      'tassoConversione': preventivi.docs.isEmpty
          ? 0
          : (preventiviAccettati / preventivi.docs.length * 100),
      'fatturato': fatturato,
      'tipiDispositivi': tipiDispositivi,
      'tempoMedioRiparazione': tempoMedioRiparazione,
      'ultimoAggiornamento':
          AppDateUtils.formatDateTime(AppDateUtils.getCurrentDateTime()),
    };
  }

  Future<List<Map<String, dynamic>>> getTrendRiparazioni() async {
    // Utilizzo di AppDateUtils per calcolare la data di 6 mesi fa
    final now = AppDateUtils.getCurrentDateTime();
    final seiMesiFa = AppDateUtils.subtractMonths(now, 6);

    final riparazioni = await _db
        .collection('riparazioni')
        .where('dataIngresso',
            isGreaterThanOrEqualTo: AppDateUtils.toUtc(seiMesiFa))
        .orderBy('dataIngresso')
        .get();

    Map<String, Map<String, dynamic>> datiMensili = {};

    for (var doc in riparazioni.docs) {
      final riparazione = Riparazione.fromMap(doc.data());
      final chiaveMese = AppDateUtils.formatYearMonth(riparazione.dataIngresso);

      if (!datiMensili.containsKey(chiaveMese)) {
        datiMensili[chiaveMese] = {
          'mese': chiaveMese,
          'inizioMese': AppDateUtils.formatDate(AppDateUtils.getFirstDayOfMonth(
              riparazione.dataIngresso.year, riparazione.dataIngresso.month)),
          'totaleRiparazioni': 0,
          'fatturato': 0.0,
          'tipiDispositivi': <String, int>{},
        };
      }

      datiMensili[chiaveMese]!['totaleRiparazioni']++;
      datiMensili[chiaveMese]!['fatturato'] += riparazione.costoFinale ?? 0;

      final tipiDispositivi =
          datiMensili[chiaveMese]!['tipiDispositivi'] as Map<String, int>;
      tipiDispositivi.update(
        riparazione.tipo,
        (value) => value + 1,
        ifAbsent: () => 1,
      );
    }

    return datiMensili.values.toList();
  }

  Future<Map<String, dynamic>> getStatisticheClienti({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final now = AppDateUtils.getCurrentDateTime();
    final start = startDate ?? AppDateUtils.subtractMonths(now, 12);
    final end = endDate ?? now;

    final clienti = await _db.collection('clienti').get();
    Map<String, int> riparazioniPerCliente = {};
    Map<String, double> fatturatoPerCliente = {};
    Map<String, String> ultimaRiparazione = {};

    for (var cliente in clienti.docs) {
      final riparazioni = await _db
          .collection('riparazioni')
          .where('clienteId', isEqualTo: cliente.id)
          .where('dataIngresso',
              isGreaterThanOrEqualTo: AppDateUtils.toUtc(start))
          .where('dataIngresso', isLessThanOrEqualTo: AppDateUtils.toUtc(end))
          .orderBy('dataIngresso', descending: true)
          .get();

      if (riparazioni.docs.isNotEmpty) {
        riparazioniPerCliente[cliente.id] = riparazioni.docs.length;

        // Trova l'ultima riparazione
        final ultimaData =
            riparazioni.docs.first.data()['dataIngresso'] as DateTime;
        ultimaRiparazione[cliente.id] = AppDateUtils.formatDateTime(ultimaData);

        // Calcola il fatturato totale
        double fatturato = 0;
        for (var doc in riparazioni.docs) {
          fatturato += doc.data()['costoFinale'] ?? 0;
        }
        fatturatoPerCliente[cliente.id] = fatturato;
      }
    }

    return {
      'periodo': {
        'inizio': AppDateUtils.formatDate(start),
        'fine': AppDateUtils.formatDate(end),
      },
      'riparazioniPerCliente': riparazioniPerCliente,
      'fatturatoPerCliente': fatturatoPerCliente,
      'ultimaRiparazionePerCliente': ultimaRiparazione,
      'ultimoAggiornamento': AppDateUtils.formatDateTime(now),
    };
  }

  // Nuovo metodo per ottenere statistiche raggruppate per periodo
  Future<Map<String, dynamic>> getStatistichePeriodo({
    required DateTime startDate,
    required DateTime endDate,
    String? groupBy, // 'giorno', 'settimana', 'mese'
  }) async {
    final start = AppDateUtils.toUtc(startDate);
    final end = AppDateUtils.toUtc(endDate);

    final riparazioni = await _db
        .collection('riparazioni')
        .where('dataIngresso', isGreaterThanOrEqualTo: start)
        .where('dataIngresso', isLessThanOrEqualTo: end)
        .orderBy('dataIngresso')
        .get();

    Map<String, Map<String, dynamic>> gruppedStats = {};

    for (var doc in riparazioni.docs) {
      final riparazione = Riparazione.fromMap(doc.data());
      String chiave;

      switch (groupBy) {
        case 'giorno':
          chiave = AppDateUtils.formatDate(riparazione.dataIngresso);
          break;
        case 'settimana':
          chiave =
              'Settimana ${AppDateUtils.getWeekNumber(riparazione.dataIngresso)}';
          break;
        case 'mese':
        default:
          chiave = AppDateUtils.formatYearMonth(riparazione.dataIngresso);
          break;
      }

      if (!gruppedStats.containsKey(chiave)) {
        gruppedStats[chiave] = {
          'periodo': chiave,
          'totaleRiparazioni': 0,
          'fatturato': 0.0,
          'tempoMedioRiparazione': 0.0,
          'riparazioniCompletate': 0,
        };
      }

      gruppedStats[chiave]!['totaleRiparazioni']++;
      gruppedStats[chiave]!['fatturato'] += riparazione.costoFinale ?? 0;

      if (riparazione.dataUscita != null) {
        gruppedStats[chiave]!['riparazioniCompletate']++;
        gruppedStats[chiave]!['tempoMedioRiparazione'] +=
            AppDateUtils.hoursBetween(
                riparazione.dataIngresso, riparazione.dataUscita!);
      }
    }

    // Calcola le medie
    for (var stats in gruppedStats.values) {
      if (stats['riparazioniCompletate'] > 0) {
        stats['tempoMedioRiparazione'] /= stats['riparazioniCompletate'];
      }
    }

    return {
      'periodo': {
        'inizio': AppDateUtils.formatDate(startDate),
        'fine': AppDateUtils.formatDate(endDate),
      },
      'raggruppamentoPer': groupBy ?? 'mese',
      'statistiche': gruppedStats.values.toList(),
      'totali': {
        'riparazioni': riparazioni.docs.length,
        'fatturato': gruppedStats.values
            .fold(0.0, (sum, stats) => sum + (stats['fatturato'] as double)),
        'tempoMedioComplessivo': gruppedStats.values
                .where((stats) => stats['riparazioniCompletate'] > 0)
                .map((stats) => stats['tempoMedioRiparazione'] as double)
                .fold(0.0, (sum, time) => sum + time) /
            gruppedStats.length,
      },
      'ultimoAggiornamento':
          AppDateUtils.formatDateTime(AppDateUtils.getCurrentDateTime()),
    };
  }
}
