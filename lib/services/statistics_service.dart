import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/riparazione.dart';
import '../utils/validators.dart';
import '../models/stato_riparazione.dart'; // Aggiunto l'import mancante

class StatisticsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<Map<String, dynamic>> getDashboardStats() async {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final endOfMonth = DateTime(now.year, now.month + 1, 0);

    final riparazioniQuery = await _firestore
        .collection('riparazioni')
        .where('dataIngresso',
            isGreaterThanOrEqualTo: startOfMonth.toIso8601String())
        .where('dataIngresso',
            isLessThanOrEqualTo: endOfMonth.toIso8601String())
        .get();

    int riparazioniTotali = 0;
    int riparazioniCompletate = 0;
    double ricaviTotali = 0;
    double costiTotali = 0;

    for (var doc in riparazioniQuery.docs) {
      final riparazione = doc.data();
      riparazioniTotali++;

      if (riparazione['stato'] == StatoRiparazione.completata.toString() ||
          riparazione['stato'] == StatoRiparazione.consegnata.toString()) {
        riparazioniCompletate++;
        ricaviTotali += riparazione['prezzo'] ?? 0;
        costiTotali += riparazione['costoRicambi'] ?? 0;
      }
    }

    return {
      'riparazioniTotali': riparazioniTotali,
      'riparazioniCompletate': riparazioniCompletate,
      'ricaviTotali': ricaviTotali,
      'costiTotali': costiTotali,
      'margine': ricaviTotali - costiTotali,
      'tassoCompletamento': riparazioniTotali > 0
          ? (riparazioniCompletate / riparazioniTotali * 100)
          : 0,
    };
  }

  Future<List<Map<String, dynamic>>> getAndamentoRiparazioni(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final riparazioniQuery = await _firestore
        .collection('riparazioni')
        .where('dataIngresso',
            isGreaterThanOrEqualTo: startDate.toIso8601String())
        .where('dataIngresso', isLessThanOrEqualTo: endDate.toIso8601String())
        .orderBy('dataIngresso')
        .get();

    final Map<String, int> conteggiPerGiorno = {};

    for (var doc in riparazioniQuery.docs) {
      final data = DateTime.parse(doc.data()['dataIngresso']);
      final dataKey =
          DateTime(data.year, data.month, data.day).toIso8601String();
      conteggiPerGiorno[dataKey] = (conteggiPerGiorno[dataKey] ?? 0) + 1;
    }

    return conteggiPerGiorno.entries
        .map((e) => {
              'data': e.key,
              'conteggio': e.value,
            })
        .toList();
  }

  Future<Map<String, dynamic>> getStatistichePerTipo() async {
    final riparazioniQuery =
        await _firestore.collection('riparazioni').where('stato', whereIn: [
      StatoRiparazione.completata.toString(),
      StatoRiparazione.consegnata.toString(),
    ]).get();

    final Map<String, dynamic> statistichePerTipo = {};

    for (var doc in riparazioniQuery.docs) {
      final riparazione = doc.data();
      final tipo = riparazione['tipo'];

      if (!statistichePerTipo.containsKey(tipo)) {
        statistichePerTipo[tipo] = {
          'conteggio': 0,
          'ricaviTotali': 0.0,
          'costiTotali': 0.0,
          'tempoMedio': Duration.zero,
        };
      }

      statistichePerTipo[tipo]['conteggio']++;
      statistichePerTipo[tipo]['ricaviTotali'] += riparazione['prezzo'] ?? 0;
      statistichePerTipo[tipo]['costiTotali'] +=
          riparazione['costoRicambi'] ?? 0;

      if (riparazione['dataCompletamento'] != null) {
        final duration = DateTime.parse(riparazione['dataCompletamento'])
            .difference(DateTime.parse(riparazione['dataIngresso']));
        final stats = statistichePerTipo[tipo];
        stats['tempoMedio'] = Duration(
          milliseconds:
              ((stats['tempoMedio'].inMilliseconds * (stats['conteggio'] - 1) +
                      duration.inMilliseconds) ~/
                  stats['conteggio']),
        );
      }
    }

    return statistichePerTipo;
  }
}
