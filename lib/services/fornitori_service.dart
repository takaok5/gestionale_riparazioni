import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/fornitore.dart';
import '../models/ordine.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class FornitoriService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Aggiunge metadati temporali ai documenti
  Map<String, dynamic> _addMetadata(Map<String, dynamic> data, {bool isNew = true}) {
    final now = AppDateUtils.getCurrentDateTime();
    final metadata = {
      'updatedAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'updatedAtFormatted': AppDateUtils.formatDateTime(now),
    };

    if (isNew) {
      metadata.addAll({
        'createdAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
        'createdAtFormatted': AppDateUtils.formatDateTime(now),
      });
    }

    return {...data, ...metadata};
  }

  Stream<List<Fornitore>> getFornitori() {
    return _firestore
        .collection('fornitori')
        .orderBy('ragioneSociale')
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              final data = doc.data();
              // Aggiungi informazioni temporali formattate
              if (data['createdAt'] != null) {
                final createdAt = (data['createdAt'] as Timestamp).toDate();
                data['createdAtFormatted'] = AppDateUtils.formatDateTime(createdAt);
              }
              if (data['updatedAt'] != null) {
                final updatedAt = (data['updatedAt'] as Timestamp).toDate();
                data['updatedAtFormatted'] = AppDateUtils.formatDateTime(updatedAt);
                data['ultimoAggiornamento'] = AppDateUtils.formatTimeAgo(updatedAt);
              }
              return Fornitore.fromMap({...data, 'id': doc.id});
            }).toList());
  }

  Future<List<Ordine>> getOrdiniRecenti(String fornitoreId) async {
    final now = AppDateUtils.getCurrentDateTime();
    // Calcola la data di 3 mesi fa per limitare gli ordini recenti
    final treeMesiFa = AppDateUtils.addMonths(now, -3);
    
    final snapshot = await _firestore
        .collection('ordini')
        .where('fornitoreId', isEqualTo: fornitoreId)
        .where('createdAt', isGreaterThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(treeMesiFa)))
        .orderBy('createdAt', descending: true)
        .limit(5)
        .get();

    return snapshot.docs.map((doc) {
      final data = doc.data();
      final createdAt = (data['createdAt'] as Timestamp).toDate();
      
      return Ordine.fromMap({
        ...data,
        'id': doc.id,
        'dataOrdineFormatted': AppDateUtils.formatDateTime(createdAt),
        'tempoTrascorso': AppDateUtils.formatTimeAgo(createdAt),
        'meseAnno': AppDateUtils.formatYearMonth(createdAt),
      });
    }).toList();
  }

  Future<void> aggiungiFornitore(Fornitore fornitore) async {
    final dataWithMetadata = _addMetadata(fornitore.toMap());
    await _firestore.collection('fornitori').add(dataWithMetadata);
  }

  Future<void> aggiornaFornitore(Fornitore fornitore) async {
    final updateData = _addMetadata(fornitore.toMap(), isNew: false);
    await _firestore
        .collection('fornitori')
        .doc(fornitore.id)
        .update(updateData);
  }

  // Nuovo metodo per ottenere statistiche ordini per periodo
  Future<Map<String, dynamic>> getStatisticheOrdini(String fornitoreId) async {
    final now = AppDateUtils.getCurrentDateTime();
    final inizioMese = AppDateUtils.startOfMonth(now);
    final fineMese = AppDateUtils.endOfMonth(now);

    final ordiniSnapshot = await _firestore
        .collection('ordini')
        .where('fornitoreId', isEqualTo: fornitoreId)
        .where('createdAt', 
            isGreaterThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(inizioMese)))
        .where('createdAt', 
            isLessThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(fineMese)))
        .get();

    double totaleOrdini = 0;
    Map<String, double> ordiniPerGiorno = {};

    for (var doc in ordiniSnapshot.docs) {
      final data = doc.data();
      final dataOrdine = (data['createdAt'] as Timestamp).toDate();
      final importo = data['importo'] as double? ?? 0;
      
      final giornoKey = AppDateUtils.formatDate(dataOrdine);
      ordiniPerGiorno[giornoKey] = (ordiniPerGiorno[giornoKey] ?? 0) + importo;
      totaleOrdini += importo;
    }

    return {
      'periodo': {
        'inizio': AppDateUtils.formatDateTime(inizioMese),
        'fine': AppDateUtils.formatDateTime(fineMese),
        'giorni': AppDateUtils.daysBetween(inizioMese, fineMese),
      },
      'totaleOrdini': totaleOrdini,
      'ordiniPerGiorno': ordiniPerGiorno,
      'mediaGiornaliera': totaleOrdini / AppDateUtils.daysBetween(inizioMese, now),
      'aggiornamento': AppDateUtils.formatDateTime(now),
    };
  }
}