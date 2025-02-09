import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/riparazione.dart';
import '../models/feedback_cliente.dart';
import 'package:gestionale_riparazioni/utils/imports.dart';

class AnalyticsService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<Map<String, dynamic>> getStatisticheMensili(int anno, int mese) async {
    final inizioMese = DateTime(anno, mese, 1);
    final fineMese = DateTime(anno, mese + 1, 0);

    final riparazioni = await _db
        .collection('riparazioni')
        .where('dataIngresso', isGreaterThanOrEqualTo: inizioMese)
        .where('dataIngresso', isLessThanOrEqualTo: fineMese)
        .get();

    final preventivi = await _db
        .collection('preventivi')
        .where('data', isGreaterThanOrEqualTo: inizioMese)
        .where('data', isLessThanOrEqualTo: fineMese)
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
        tempoMedioRiparazione += riparazione.dataUscita!
            .difference(riparazione.dataIngresso)
            .inHours;
      }
    }

    if (totaleRiparazioni > 0) {
      tempoMedioRiparazione /= totaleRiparazioni;
    }

    return {
      'totaleRiparazioni': totaleRiparazioni,
      'preventiviAccettati': preventiviAccettati,
      'tassoConversione': preventivi.docs.isEmpty
          ? 0
          : (preventiviAccettati / preventivi.docs.length * 100),
      'fatturato': fatturato,
      'tipiDispositivi': tipiDispositivi,
      'tempoMedioRiparazione': tempoMedioRiparazione,
    };
  }

  Future<List<Map<String, dynamic>>> getTrendRiparazioni() async {
    final now = DateTime.now();
    final seiMesiFa = DateTime(now.year, now.month - 6, now.day);

    final riparazioni = await _db
        .collection('riparazioni')
        .where('dataIngresso', isGreaterThanOrEqualTo: seiMesiFa)
        .orderBy('dataIngresso')
        .get();

    Map<String, Map<String, dynamic>> datiMensili = {};

    for (var doc in riparazioni.docs) {
      final riparazione = Riparazione.fromMap(doc.data());
      final chiaveMese = DateFormat('yyyy-MM').format(riparazione.dataIngresso);

      if (!datiMensili.containsKey(chiaveMese)) {
        datiMensili[chiaveMese] = {
          'mese': chiaveMese,
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

  Future<Map<String, dynamic>> getStatisticheClienti() async {
    final clienti = await _db.collection('clienti').get();
    Map<String, int> riparazioniPerCliente = {};
    Map<String, double> fatturatoPerCliente = {};

    for (var cliente in clienti.docs) {
      final riparazioni = await _db
          .collection('riparazioni')
          .where('clienteId', isEqualTo: cliente.id)
          .get();

      riparazioniPerCliente[cliente.id] = riparazioni.docs.length;

      double fatturato = 0;
      for (var doc in riparazioni.docs) {
        fatturato += doc.data()['costoFinale'] ?? 0;
      }
      fatturatoPerCliente[cliente.id] = fatturato;
    }

    return {
      'riparazioniPerCliente': riparazioniPerCliente,
      'fatturatoPerCliente': fatturatoPerCliente,
    };
  }
}
