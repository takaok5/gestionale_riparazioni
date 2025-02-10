import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import 'enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class OrdiniService {
  final FirebaseFirestore _db;
  final String collectionName = 'ordini';

  OrdiniService(this._db);

  // Utility per aggiungere metadati temporali
  Map<String, dynamic> _addMetadata(Map<String, dynamic> data,
      {bool isNew = true}) {
    final now = AppDateUtils.getCurrentDateTime();
    data['updatedAt'] = Timestamp.fromDate(AppDateUtils.toUtc(now));
    data['updatedAtFormatted'] = AppDateUtils.formatDateTime(now);

    if (isNew) {
      data['createdAt'] = Timestamp.fromDate(AppDateUtils.toUtc(now));
      data['createdAtFormatted'] = AppDateUtils.formatDateTime(now);
      data['periodo'] = {
        'anno': AppDateUtils.getYear(now),
        'mese': AppDateUtils.getMonth(now),
        'settimana': AppDateUtils.getWeekNumber(now),
      };
    }
    return data;
  }

  Stream<List<Ordine>> getOrdiniStream({
    required String userId,
    StatoOrdine? stato,
    String? fornitoreId,
    DateTime? dataInizio,
    DateTime? dataFine,
  }) {
    Query query =
        _db.collection(collectionName).where('userId', isEqualTo: userId);

    if (stato != null) {
      query = query.where('stato', isEqualTo: stato.index);
    }

    if (fornitoreId != null) {
      query = query.where('fornitoreId', isEqualTo: fornitoreId);
    }

    if (dataInizio != null) {
      query = query.where('createdAt',
          isGreaterThanOrEqualTo:
              Timestamp.fromDate(AppDateUtils.toUtc(dataInizio)));
    }

    if (dataFine != null) {
      query = query.where('createdAt',
          isLessThanOrEqualTo:
              Timestamp.fromDate(AppDateUtils.toUtc(dataFine)));
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        final data = doc.data() as Map<String, dynamic>;
        final createdAt = (data['createdAt'] as Timestamp).toDate();
        final now = AppDateUtils.getCurrentDateTime();

        return OrdineRicambi.fromMap({
          'id': doc.id,
          ...data,
          'dataOrdineFormatted': AppDateUtils.formatDateTime(createdAt),
          'giorniTrascorsi': AppDateUtils.daysBetween(createdAt, now),
          'meseAnno': AppDateUtils.formatYearMonth(createdAt),
        });
      }).toList();
    });
  }

  Future<void> createOrdine(Ordine ordine) async {
    final ordineData = _addMetadata(ordine.toMap());
    await _db.collection(collectionName).doc(ordine.id).set(ordineData);
  }

  Future<void> updateOrdine(Ordine ordine) async {
    final updateData = _addMetadata(ordine.toMap(), isNew: false);
    await _db.collection(collectionName).doc(ordine.id).update(updateData);
  }

  Future<void> deleteOrdine(String id) async {
    await _db.collection(collectionName).doc(id).delete();
  }

  Future<Map<String, dynamic>> getStatisticheFornitori({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final now = AppDateUtils.getCurrentDateTime();
    startDate ??= AppDateUtils.startOfMonth(now);
    endDate ??= now;

    Query query = _db
        .collection(collectionName)
        .where('createdAt',
            isGreaterThanOrEqualTo:
                Timestamp.fromDate(AppDateUtils.toUtc(startDate)))
        .where('createdAt',
            isLessThanOrEqualTo:
                Timestamp.fromDate(AppDateUtils.toUtc(endDate)));

    final QuerySnapshot snapshot = await query.get();

    Map<String, dynamic> statistiche = {
      'periodo': {
        'inizio': AppDateUtils.formatDateTime(startDate),
        'fine': AppDateUtils.formatDateTime(endDate),
        'giorni': AppDateUtils.daysBetween(startDate, endDate),
      },
      'fornitori': {},
      'totali': {
        'numeroOrdini': 0,
        'spesaTotale': 0.0,
        'mediaGiornaliera': 0.0,
      },
      'perPeriodo': {},
    };

    for (var doc in snapshot.docs) {
      final ordine = Ordine.fromMap({
        'id': doc.id,
        ...doc.data() as Map<String, dynamic>,
      });

      final createdAt =
          (doc.data() as Map<String, dynamic>)['createdAt'] as Timestamp;
      final dataOrdine = createdAt.toDate();
      final periodoKey = AppDateUtils.formatYearMonth(dataOrdine);

      // Aggiorna statistiche fornitore
      if (!statistiche['fornitori'].containsKey(ordine.fornitoreId)) {
        statistiche['fornitori'][ordine.fornitoreId] = {
          'nome': ordine.fornitoreNome,
          'totaleOrdini': 0,
          'totaleSpesa': 0.0,
          'ultimoOrdine': null,
        };
      }

      statistiche['fornitori'][ordine.fornitoreId]['totaleOrdini']++;
      statistiche['fornitori'][ordine.fornitoreId]['totaleSpesa'] +=
          ordine.totale;
      statistiche['fornitori'][ordine.fornitoreId]['ultimoOrdine'] =
          AppDateUtils.formatDateTime(dataOrdine);

      // Aggiorna statistiche per periodo
      if (!statistiche['perPeriodo'].containsKey(periodoKey)) {
        statistiche['perPeriodo'][periodoKey] = {
          'numeroOrdini': 0,
          'spesaTotale': 0.0,
        };
      }

      statistiche['perPeriodo'][periodoKey]['numeroOrdini']++;
      statistiche['perPeriodo'][periodoKey]['spesaTotale'] += ordine.totale;

      // Aggiorna totali
      statistiche['totali']['numeroOrdini']++;
      statistiche['totali']['spesaTotale'] += ordine.totale;
    }

    // Calcola media giornaliera
    final giorniTotali = AppDateUtils.daysBetween(startDate, endDate);
    if (giorniTotali > 0) {
      statistiche['totali']['mediaGiornaliera'] =
          statistiche['totali']['spesaTotale'] / giorniTotali;
    }

    statistiche['ultimoAggiornamento'] = AppDateUtils.formatDateTime(now);

    return statistiche;
  }

  // Nuovo metodo per ottenere gli ordini recenti di un fornitore
  Future<List<Ordine>> getOrdiniRecentiFornitori(String fornitoreId,
      {int limit = 5}) async {
    final now = AppDateUtils.getCurrentDateTime();
    final treeMesiFa = AppDateUtils.addMonths(now, -3);

    final snapshot = await _db
        .collection(collectionName)
        .where('fornitoreId', isEqualTo: fornitoreId)
        .where('createdAt',
            isGreaterThanOrEqualTo:
                Timestamp.fromDate(AppDateUtils.toUtc(treeMesiFa)))
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .get();

    return snapshot.docs.map((doc) {
      final data = doc.data();
      final createdAt = (data['createdAt'] as Timestamp).toDate();

      return Ordine.fromMap({
        ...data,
        'id': doc.id,
        'dataOrdineFormatted': AppDateUtils.formatDateTime(createdAt),
        'giorniTrascorsi': AppDateUtils.daysBetween(createdAt, now),
      });
    }).toList();
  }
}
