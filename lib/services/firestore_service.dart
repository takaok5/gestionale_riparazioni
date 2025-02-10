import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';
import 'base_service.dart';
import '../models/riparazione.dart';
import '../services/app_context_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import 'package:firebase_auth/firebase_auth.dart';

class FirestoreService extends BaseService {
  final FirebaseFirestore _db;
  final AppContextService _appContextService;

  // Cache delle query frequenti
  final Map<String, dynamic> _queryCache = {};
  static const int CACHE_DURATION_MINUTES = 5;
  static const int DEFAULT_LIMIT = 50;

  // Singleton pattern ottimizzato
  static final FirestoreService _instance = FirestoreService._internal();
  static final AppContextService _appContextService = AppContextService();

  factory FirestoreService() => _instance;

  FirestoreService._internal()
      : _db = FirebaseFirestore.instance,
        _appContextService = _appContextService,
        super(_appContextService);

  @override
  Future<void> initialize() async {
    await _db.enablePersistence(const PersistenceSettings(synchronizeTabs: true));
    await _clearExpiredCache();
  }

  @override
  Future<void> dispose() async {
    _queryCache.clear();
  }

  // Utility methods con gestione ottimizzata delle date
  Map<String, dynamic> addMetadata(Map<String, dynamic> data, {bool isNew = true}) {
    final now = AppDateUtils.getCurrentDateTime();
    final Map<String, dynamic> metadata = {
      'updatedAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'updatedAtFormatted': AppDateUtils.formatDateTime(now),
      'periodo': {
        'anno': AppDateUtils.getYear(now),
        'mese': AppDateUtils.getMonth(now),
        'settimana': AppDateUtils.getWeekNumber(now),
      }
    };

    if (isNew) {
      metadata.addAll({
        'createdAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
        'createdAtFormatted': AppDateUtils.formatDateTime(now),
      });
    }

    return {...data, ...metadata};
  }

  Future<void> logOperation(String collection, String operation, String docId) async {
    final now = AppDateUtils.getCurrentDateTime();
    final logEntry = {
      'collection': collection,
      'documentId': docId,
      'operation': operation,
      'timestamp': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'timestampFormatted': AppDateUtils.formatDateTime(now),
      'yearMonth': AppDateUtils.formatYearMonth(now),
      'userId': FirebaseAuth.instance.currentUser?.uid,
    };

    // Batch write per log e cache update
    final batch = _db.batch();
    batch.set(_db.collection('logs').doc(), logEntry);
    await batch.commit();
  }

  // CRUD Operations ottimizzate
  Future<DocumentReference> create(String collection, Map<String, dynamic> data) async {
    try {
      final docData = addMetadata(data);
      final docRef = await _db.collection(collection).add(docData);
      await logOperation(collection, 'create', docRef.id);
      _invalidateCollectionCache(collection);
      return docRef;
    } catch (e) {
      throw FirestoreException('Errore durante la creazione del documento: $e');
    }
  }

  Future<void> update(String collection, String id, Map<String, dynamic> data) async {
    try {
      final updateData = addMetadata(data, isNew: false);
      await _db.collection(collection).doc(id).update(updateData);
      await logOperation(collection, 'update', id);
      _invalidateCollectionCache(collection);
    } catch (e) {
      throw FirestoreException('Errore durante l\'aggiornamento del documento: $e');
    }
  }

  Future<void> delete(String collection, String id) async {
    try {
      await _db.collection(collection).doc(id).delete();
      await logOperation(collection, 'delete', id);
      _invalidateCollectionCache(collection);
    } catch (e) {
      throw FirestoreException('Errore durante l\'eliminazione del documento: $e');
    }
  }

  // Riparazioni con gestione ottimizzata
  Future<void> addRiparazione(Riparazione riparazione) async {
    final now = AppDateUtils.getCurrentDateTime();
    final data = {
      ...riparazione.toMap(),
      'dataIngresso': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'dataIngressoFormatted': AppDateUtils.formatDateTime(now),
      'settimana': AppDateUtils.getWeekNumber(now),
      'mese': AppDateUtils.formatYearMonth(now),
    };
    
    await create('riparazioni', data);
  }

  Future<void> updateRiparazione(String id, Map<String, dynamic> data) async {
    if (data.containsKey('dataCompletamento')) {
      final completamento = AppDateUtils.getCurrentDateTime();
      data['dataCompletamento'] = Timestamp.fromDate(AppDateUtils.toUtc(completamento));
      data['dataCompletamentoFormatted'] = AppDateUtils.formatDateTime(completamento);
      data['durataRiparazione'] = AppDateUtils.daysBetween(
        (data['dataIngresso'] as Timestamp).toDate(),
        completamento
      );
    }
    
    await update('riparazioni', id, data);
  }

  Stream<List<Riparazione>> getRiparazioni() {
    return _db
        .collection('riparazioni')
        .orderBy('dataIngresso', descending: true)
        .limit(DEFAULT_LIMIT)
        .snapshots()
        .map(_mapRiparazioni);
  }

  Stream<List<Riparazione>> getRiparazioniByStato(StatoRiparazione stato) {
    return _db
        .collection('riparazioni')
        .where('stato', isEqualTo: stato.toString())
        .orderBy('dataIngresso', descending: true)
        .limit(DEFAULT_LIMIT)
        .snapshots()
        .map(_mapRiparazioni);
  }

  Stream<List<Riparazione>> getRiparazioniArchiviate(String clienteId) {
    return _db
        .collection('riparazioni')
        .where('clienteId', isEqualTo: clienteId)
        .where('stato', whereIn: [
          StatoRiparazione.completata.toString(),
          StatoRiparazione.consegnata.toString(),
        ])
        .orderBy('dataIngresso', descending: true)
        .limit(DEFAULT_LIMIT)
        .snapshots()
        .map(_mapRiparazioni);
  }

  List<Riparazione> _mapRiparazioni(QuerySnapshot snapshot) {
    return snapshot.docs.map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return Riparazione.fromMap({
        ...data,
        'id': doc.id,
        'tempoTrascorso': _calcolaTempoTrascorso(data['dataIngresso'] as Timestamp),
      });
    }).toList();
  }

  String _calcolaTempoTrascorso(Timestamp timestamp) {
    final now = AppDateUtils.getCurrentDateTime();
    final data = timestamp.toDate();
    return AppDateUtils.formatTimeAgo(data, now);
  }

  // Clienti con cache ottimizzata
  Stream<List<Cliente>> getClienti() {
    final cacheKey = 'clienti_list';
    return _db
        .collection('clienti')
        .orderBy('cognome')
        .snapshots()
        .map((snapshot) {
          final clienti = snapshot.docs
              .map((doc) => Cliente.fromMap({...doc.data(), 'id': doc.id}))
              .toList();
          _queryCache[cacheKey] = {
            'data': clienti,
            'timestamp': AppDateUtils.getCurrentDateTime()
          };
          return clienti;
        });
  }

  Future<Cliente> getCliente(String id) async {
    try {
      final doc = await _db.collection('clienti').doc(id).get();
      if (!doc.exists) {
        throw Exception('Cliente non trovato');
      }
      return Cliente.fromMap({...doc.data()!, 'id': doc.id});
    } catch (e) {
      print('Error getting cliente: $e');
      throw e;
    }
  }

  Future<void> addCliente(Cliente cliente) async {
    await create('clienti', cliente.toMap());
  }

  Future<void> updateCliente(Cliente cliente) async {
    await update('clienti', cliente.id, cliente.toMap());
  }

  // Impostazioni con cache
  Future<ImpostazioniColori> getImpostazioniColori() async {
    try {
      final cacheKey = 'impostazioni_colori';
      if (_isCacheValid(cacheKey)) {
        return _queryCache[cacheKey]['data'];
      }

      final doc = await _db.collection('impostazioni').doc('colori').get();
      final impostazioni = doc.exists
          ? ImpostazioniColori.fromMap({...doc.data()!, 'id': doc.id})
          : ImpostazioniColori.defaultSettings();

      _queryCache[cacheKey] = {
        'data': impostazioni,
        'timestamp': AppDateUtils.getCurrentDateTime()
      };
      return impostazioni;
    } catch (e) {
      throw FirestoreException(
          'Errore durante il recupero delle impostazioni colori: $e');
    }
  }

  Future<void> salvaImpostazioniColori(ImpostazioniColori impostazioni) async {
    try {
      final data = addMetadata(impostazioni.toMap(), isNew: false);
      await _db.collection('impostazioni').doc('colori').set(data);
      await logOperation('impostazioni', 'update', 'colori');
      _invalidateCollectionCache('impostazioni');
    } catch (e) {
      throw FirestoreException(
          'Errore durante il salvataggio delle impostazioni colori: $e');
    }
  }

  // Statistiche ottimizzate con cache
  Future<Map<String, dynamic>> getStatistiche() async {
    try {
      final now = AppDateUtils.getCurrentDateTime();
      final startOfMonth = AppDateUtils.startOfMonth(now);
      final endOfMonth = AppDateUtils.endOfMonth(now);

      final cacheKey = 'statistiche_${AppDateUtils.formatYearMonth(now)}';
      if (_isCacheValid(cacheKey)) {
        return _queryCache[cacheKey]['data'];
      }

      final riparazioniSnapshot = await _db
          .collection('riparazioni')
          .where('dataCompletamento',
              isGreaterThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(startOfMonth)))
          .where('dataCompletamento',
              isLessThanOrEqualTo: Timestamp.fromDate(AppDateUtils.toUtc(endOfMonth)))
          .get();

      final stats = await _calcolaStatistiche(riparazioniSnapshot.docs, now);
      
      _queryCache[cacheKey] = {
        'data': stats,
        'timestamp': now
      };

      return stats;
    } catch (e) {
      throw FirestoreException('Errore durante il recupero delle statistiche: $e');
    }
  }

  Future<Map<String, dynamic>> _calcolaStatistiche(
      List<QueryDocumentSnapshot> docs, DateTime now) async {
    final startOfMonth = AppDateUtils.startOfMonth(now);
    final endOfMonth = AppDateUtils.endOfMonth(now);
    
    double ricaviTotali = 0;
    int riparazioniCompletate = 0;
    int riparazioniInCorso = 0;
    Map<String, double> ricaviGiornalieri = {};
    Map<String, int> riparazioniPerTipo = {};

    for (var doc in docs) {
      final data = doc.data() as Map<String, dynamic>;
      final riparazione = Riparazione.fromMap({...data, 'id': doc.id});
      final dataCompletamento = (data['dataCompletamento'] as Timestamp).toDate();
      final giornoKey = AppDateUtils.formatDate(dataCompletamento);

      if (riparazione.stato == StatoRiparazione.completata ||
          riparazione.stato == StatoRiparazione.consegnata) {
        ricaviTotali += riparazione.prezzo;
        riparazioniCompletate++;
        
        ricaviGiornalieri[giornoKey] = 
            (ricaviGiornalieri[giornoKey] ?? 0) + riparazione.prezzo;
        
        riparazioniPerTipo[riparazione.tipo] = 
            (riparazioniPerTipo[riparazione.tipo] ?? 0) + 1;
      } else if (riparazione.stato == StatoRiparazione.inLavorazione) {
        riparazioniInCorso++;
      }
    }

    final giorniLavorativi = AppDateUtils.getWorkingDays(startOfMonth, now);

    return {
      'periodo': {
        'inizio': AppDateUtils.formatDateTime(startOfMonth),
        'fine': AppDateUtils.formatDateTime(endOfMonth),
        'giorniTotali': AppDateUtils.daysBetween(startOfMonth, endOfMonth),
        'giorniLavorativi': giorniLavorativi,
      },
      'ricavi': {
        'totale': ricaviTotali,
        'giornalieri': ricaviGiornalieri,
        'mediaGiornaliera': ricaviTotali / giorniLavorativi,
      },
      'riparazioni': {
        'completate': riparazioniCompletate,
        'inCorso': riparazioniInCorso,
        'perTipo': riparazioniPerTipo,
      },
      'meta': {
        'aggiornamento': AppDateUtils.formatDateTime(now),
        'prossimoCaching': AppDateUtils.formatDateTime(
          now.add(const Duration(minutes: CACHE_DURATION_MINUTES))
        ),
      }
    };
  }

  // Batch Operations ottimizzate
  Future<void> executeBatch(List<BatchOperation> operations) async {
    try {
      final batch = _db.batch();
      final collectionsToInvalidate = <String>{};

      for (var operation in operations) {
        final docRef = _db.doc(operation.path);
        final collection = operation.path.split('/')[0];
        collectionsToInvalidate.add(collection);

        switch (operation.type) {
          case BatchOperationType.create:
            batch.set(docRef, addMetadata(operation.data));
            break;
          case BatchOperationType.update:
            batch.update(docRef, addMetadata(operation.data, isNew: false));
            break;
          case BatchOperationType.delete:
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
      
      // Invalida le cache delle collezioni interessate