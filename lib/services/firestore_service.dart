import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';
import 'base_service.dart';
import '../models/stato_riparazione.dart';
import '../services/app_context_service.dart';

class FirestoreService extends BaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Singleton pattern
  static final AppContextService _appContextService = AppContextService();
  static final FirestoreService _instance = FirestoreService._internal();

  factory FirestoreService() {
    return _instance;
  }

  FirestoreService._internal() : super(_appContextService);

  @override
  Future<void> initialize() async {
    // Implementazione dell'inizializzazione
    await _db.enablePersistence();
  }

  @override
  Future<void> dispose() async {
    // Cleanup code
  }

  // Metodi di utility
  Map<String, dynamic> addMetadata(Map<String, dynamic> data,
      {bool isNew = true}) {
    data['updatedAt'] = FieldValue.serverTimestamp();
    if (isNew && !data.containsKey('createdAt')) {
      data['createdAt'] = FieldValue.serverTimestamp();
    }
    return data;
  }

  Future<void> logOperation(
      String collection, String operation, String docId) async {
    await _db.collection('logs').add({
      'collection': collection,
      'documentId': docId,
      'operation': operation,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  @override
  Future<void> dispose() async {
    // Implementa la pulizia delle risorse
  }

  // CRUD Operations
  Future<DocumentReference> create(
      String collection, Map<String, dynamic> data) async {
    try {
      return await _db.collection(collection).add(data);
    } catch (e) {
      throw FirestoreException('Errore durante la creazione del documento: $e');
    }
  }

  Future<void> update(
      String collection, String id, Map<String, dynamic> data) async {
    try {
      await _db.collection(collection).doc(id).update(data);
    } catch (e) {
      throw FirestoreException(
          'Errore durante l\'aggiornamento del documento: $e');
    }
  }

  Future<void> delete(String collection, String id) async {
    try {
      await _db.collection(collection).doc(id).delete();
    } catch (e) {
      throw FirestoreException(
          'Errore durante l\'eliminazione del documento: $e');
    }
  }

  Future<void> addRiparazione(Riparazione riparazione) async {
    final data = addMetadata(riparazione.toMap());
    final docRef = await _db.collection('riparazioni').add(data);
    logOperation('riparazioni', 'create', docRef.id);
  }

  Future<void> updateRiparazione(String id, Map<String, dynamic> data) async {
    final updateData = addMetadata(data, isNew: false);
    await _db.collection('riparazioni').doc(id).update(updateData);
    logOperation('riparazioni', 'update', id);
  }

  // Riparazioni
  Stream<List<Riparazione>> getRiparazioni() {
    return _db
        .collection('riparazioni')
        .orderBy('dataIngresso', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Riparazione.fromMap({...doc.data(), 'id': doc.id}))
          .toList();
    });
  }

  Stream<List<Riparazione>> getRiparazioniByStato(StatoRiparazione stato) {
    return _db
        .collection('riparazioni')
        .where('stato', isEqualTo: stato.toString())
        .orderBy('dataIngresso', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Riparazione.fromMap({...doc.data(), 'id': doc.id}))
          .toList();
    });
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
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => Riparazione.fromMap({...doc.data(), 'id': doc.id}))
              .toList();
        });
  }

  // Clienti
  Stream<List<Cliente>> getClienti() {
    return _db
        .collection('clienti')
        .orderBy('cognome')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Cliente.fromMap({...doc.data(), 'id': doc.id}))
          .toList();
    });
  }

  Future<void> addCliente(Cliente cliente) async {
    try {
      await _db.collection('clienti').add(cliente.toMap());
    } catch (e) {
      throw FirestoreException('Errore durante l\'aggiunta del cliente: $e');
    }
  }

  Future<void> updateCliente(Cliente cliente) async {
    try {
      await _db.collection('clienti').doc(cliente.id).update(cliente.toMap());
    } catch (e) {
      throw FirestoreException(
          'Errore durante l\'aggiornamento del cliente: $e');
    }
  }

  // Impostazioni
  Future<ImpostazioniColori> getImpostazioniColori() async {
    try {
      final doc = await _db.collection('impostazioni').doc('colori').get();
      if (doc.exists) {
        return ImpostazioniColori.fromMap({...doc.data()!, 'id': doc.id});
      }
      return ImpostazioniColori
          .defaultSettings(); // Cambiato da createDefault a defaultSettings
    } catch (e) {
      throw FirestoreException(
          'Errore durante il recupero delle impostazioni colori: $e');
    }
  }

  Future<void> salvaImpostazioniColori(ImpostazioniColori impostazioni) async {
    try {
      await _db
          .collection('impostazioni')
          .doc('colori')
          .set(impostazioni.toMap());
    } catch (e) {
      throw FirestoreException(
          'Errore durante il salvataggio delle impostazioni colori: $e');
    }
  }

  // Statistiche
  Future<Map<String, dynamic>> getStatistiche() async {
    try {
      final now = DateTime.now();
      final startOfMonth = DateTime(now.year, now.month, 1);
      final endOfMonth = DateTime(now.year, now.month + 1, 0, 23, 59, 59);

      final riparazioniSnapshot = await _db
          .collection('riparazioni')
          .where('dataCompletamento',
              isGreaterThanOrEqualTo: startOfMonth.toIso8601String())
          .where('dataCompletamento',
              isLessThanOrEqualTo: endOfMonth.toIso8601String())
          .get();

      double ricaviTotali = 0;
      int riparazioniCompletate = 0;
      int riparazioniInCorso = 0;

      for (var doc in riparazioniSnapshot.docs) {
        final riparazione = Riparazione.fromMap({...doc.data(), 'id': doc.id});
        if (riparazione.stato == StatoRiparazione.completata ||
            riparazione.stato == StatoRiparazione.consegnata) {
          ricaviTotali += riparazione.prezzo;
          riparazioniCompletate++;
        } else if (riparazione.stato == StatoRiparazione.inLavorazione) {
          riparazioniInCorso++;
        }
      }

      return {
        'ricaviMensili': ricaviTotali,
        'riparazioniCompletate': riparazioniCompletate,
        'riparazioniInCorso': riparazioniInCorso,
      };
    } catch (e) {
      throw FirestoreException(
          'Errore durante il recupero delle statistiche: $e');
    }
  }

  // Batch Operations
  Future<void> executeBatch(List<BatchOperation> operations) async {
    try {
      final batch = _db.batch();

      for (var operation in operations) {
        final docRef = _db.doc(operation.path);
        switch (operation.type) {
          case BatchOperationType.create:
            batch.set(docRef, operation.data);
            break;
          case BatchOperationType.update:
            batch.update(docRef, operation.data);
            break;
          case BatchOperationType.delete:
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
    } catch (e) {
      throw FirestoreException('Errore durante l\'esecuzione del batch: $e');
    }
  }
}

enum BatchOperationType { create, update, delete }

class BatchOperation {
  final String path;
  final BatchOperationType type;
  final Map<String, dynamic> data;

  BatchOperation({
    required this.path,
    required this.type,
    this.data = const {},
  });
}

class FirestoreException implements Exception {
  final String message;

  FirestoreException(this.message);

  @override
  String toString() => message;
}
