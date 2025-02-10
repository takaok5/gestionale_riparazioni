import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ricambio.dart';
import '../models/categoria.dart';
import '../models/movimento_magazzino.dart';
import '../services/app_context_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import 'base_service.dart';

class InventoryService extends BaseService {
  final FirebaseFirestore _firestore;
  final AppContextService _appContext;

  InventoryService(AppContextService appContext)
      : _firestore = FirebaseFirestore.instance,
        _appContext = appContext,
        super('ricambi');

  // Utility per aggiungere metadati temporali
  Map<String, dynamic> _addMetadata(Map<String, dynamic> data, {bool isNew = true}) {
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

  // Ricambi
  Stream<List<Ricambio>> getRicambi() {
    return _firestore
        .collection('ricambi')
        .snapshots()
        .asyncMap((snapshot) async {
      final ricambi = <Ricambio>[];

      for (var doc in snapshot.docs) {
        final data = doc.data();
        final categoriaId = data['categoriaId'] as String;
        final categoriaDoc =
            await _firestore.collection('categorie').doc(categoriaId).get();

        if (categoriaDoc.exists) {
          final categoria = Categoria.fromMap({
            ...categoriaDoc.data()!,
            'id': categoriaDoc.id,
          });

          // Aggiungi informazioni temporali
          if (data['createdAt'] != null) {
            final createdAt = (data['createdAt'] as Timestamp).toDate();
            data['createdAtFormatted'] = AppDateUtils.formatDateTime(createdAt);
            data['giorniInMagazzino'] = AppDateUtils.daysBetween(
                createdAt, AppDateUtils.getCurrentDateTime());
          }

          ricambi.add(Ricambio.fromMap(
            {...data, 'id': doc.id},
            categoria: categoria,
          ));
        }
      }

      return ricambi;
    });
  }

  Future<List<Ricambio>> getRicambiSottoScorta() async {
    final snapshot = await _firestore.collection('ricambi').get();
    final ricambi = <Ricambio>[];
    final now = AppDateUtils.getCurrentDateTime();

    for (var doc in snapshot.docs) {
      final data = doc.data();
      final categoriaId = data['categoriaId'] as String;
      final categoriaDoc =
          await _firestore.collection('categorie').doc(categoriaId).get();

      if (categoriaDoc.exists) {
        final categoria = Categoria.fromMap({
          ...categoriaDoc.data()!,
          'id': categoriaDoc.id,
        });

        // Aggiungi informazioni temporali e di giacenza
        if (data['lastCheck'] != null) {
          final lastCheck = (data['lastCheck'] as Timestamp).toDate();
          data['lastCheckFormatted'] = AppDateUtils.formatDateTime(lastCheck);
          data['giorniDalControllo'] = AppDateUtils.daysBetween(lastCheck, now);
        }

        final ricambio = Ricambio.fromMap(
          {...data, 'id': doc.id},
          categoria: categoria,
        );

        if (ricambio.sottoScorta) {
          ricambi.add(ricambio);
        }
      }
    }

    return ricambi;
  }

  // Movimenti Magazzino
  Future<void> addMovimento(MovimentoMagazzino movimento) async {
    final batch = _firestore.batch();
    final now = AppDateUtils.getCurrentDateTime();

    // Prepara i dati del movimento con timestamp
    final movimentoData = {
      ...movimento.toMap(),
      'timestamp': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'timestampFormatted': AppDateUtils.formatDateTime(now),
      'periodo': {
        'anno': AppDateUtils.getYear(now),
        'mese': AppDateUtils.getMonth(now),
        'settimana': AppDateUtils.getWeekNumber(now),
      }
    };

    // Aggiungi il movimento
    final movimentoRef = _firestore.collection('movimenti').doc();
    batch.set(movimentoRef, _addMetadata(movimentoData));

    // Aggiorna la quantità del ricambio
    final ricambioRef =
        _firestore.collection('ricambi').doc(movimento.ricambioId);
    final quantitaAggiornata = movimento.tipo == TipoMovimento.carico
        ? FieldValue.increment(movimento.quantita)
        : FieldValue.increment(-movimento.quantita);

    batch.update(ricambioRef, _addMetadata({
      'quantita': quantitaAggiornata,
      'lastMovimento': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'lastMovimentoFormatted': AppDateUtils.formatDateTime(now),
    }, isNew: false));

    try {
      await batch.commit();
    } catch (e) {
      print('Errore durante l\'aggiornamento del movimento: $e');
      rethrow;
    }
  }

  Stream<List<MovimentoMagazzino>> getMovimentiRecenti() {
    final now = AppDateUtils.getCurrentDateTime();
    final startOfMonth = AppDateUtils.startOfMonth(now);
    
    return _firestore
        .collection('movimenti')
        .where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(startOfMonth)))
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
          final data = doc.data();
          final timestamp = (data['timestamp'] as Timestamp).toDate();
          
          return MovimentoMagazzino.fromMap({
            ...data,
            'id': doc.id,
            'timestampFormatted': AppDateUtils.formatDateTime(timestamp),
            'giorniPassati': AppDateUtils.daysBetween(timestamp, now),
            'periodo': {
              'anno': AppDateUtils.getYear(timestamp),
              'mese': AppDateUtils.getMonth(timestamp),
              'settimana': AppDateUtils.getWeekNumber(timestamp),
            }
          });
        }).toList());
  }

  // Statistiche Magazzino
  Future<Map<String, dynamic>> getStatisticheMagazzino() async {
    final now = AppDateUtils.getCurrentDateTime();
    final startOfMonth = AppDateUtils.startOfMonth(now);
    final stats = {
      'periodo': {
        'inizio': AppDateUtils.formatDateTime(startOfMonth),
        'fine': AppDateUtils.formatDateTime(now),
        'giorni': AppDateUtils.daysBetween(startOfMonth, now),
      },
      'movimenti': {
        'totali': 0,
        'carichi': 0,
        'scarichi': 0,
        'perGiorno': <String, int>{},
      },
      'valore': await getValoreTotaleMagazzino(),
      'ultimoAggiornamento': AppDateUtils.formatDateTime(now),
    };

    // Aggiungi statistiche movimenti
    final movimenti = await _firestore
        .collection('movimenti')
        .where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(startOfMonth)))
        .get();

    for (var doc in movimenti.docs) {
      final data = doc.data();
      final timestamp = (data['timestamp'] as Timestamp).toDate();
      final giornoKey = AppDateUtils.formatDate(timestamp);
      
      stats['movimenti']['totali'] = (stats['movimenti']['totali'] as int) + 1;
      stats['movimenti']['perGiorno'][giornoKey] = 
          (stats['movimenti']['perGiorno'][giornoKey] ?? 0) + 1;

      if (data['tipo'] == TipoMovimento.carico.toString()) {
        stats['movimenti']['carichi'] = (stats['movimenti']['carichi'] as int) + 1;
      } else {
        stats['movimenti']['scarichi'] = (stats['movimenti']['scarichi'] as int) + 1;
      }
    }

    return stats;
  }
}