import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:convert';

class BackupService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Singleton pattern
  static final BackupService _instance = BackupService._internal();
  factory BackupService() => _instance;
  BackupService._internal();

  Future<void> createBackup() async {
    try {
      final timestamp = DateTime.now().toIso8601String();
      final backupData = <String, dynamic>{};

      // Backup delle collezioni principali
      final collections = [
        'riparazioni',
        'clienti',
        'ricambi',
        'garanzie',
        'fornitori',
        'ordini_ricambi',
        'messaggi',
      ];

      for (var collection in collections) {
        final querySnapshot = await _db.collection(collection).get();
        backupData[collection] = querySnapshot.docs
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList();
      }

      // Salva il backup su Storage
      final backupJson = jsonEncode(backupData);
      final backupRef = _storage.ref('backups/$timestamp.json');
      await backupRef.putString(backupJson);

      // Registra il backup nel database
      await _db.collection('backups').add({
        'timestamp': timestamp,
        'size': backupJson.length,
        'collections': collections,
        'status': 'completed',
      });
    } catch (e) {
      await _db.collection('backups').add({
        'timestamp': DateTime.now().toIso8601String(),
        'error': e.toString(),
        'status': 'failed',
      });
      rethrow;
    }
  }

  Future<Map<String, dynamic>> restoreBackup(String backupId) async {
    try {
      // Ottieni il backup dallo Storage
      final backupRef = _storage.ref('backups/$backupId.json');
      final backupData = await backupRef.getData();

      if (backupData == null) {
        throw Exception('Backup non trovato');
      }

      final backup = jsonDecode(utf8.decode(backupData));

      // Ripristina le collezioni
      for (var collection in backup.keys) {
        final collectionRef = _db.collection(collection);
        final batch = _db.batch();

        for (var doc in backup[collection]) {
          final docId = doc['id'];
          doc.remove('id');
          batch.set(collectionRef.doc(docId), doc);
        }

        await batch.commit();
      }

      return {
        'status': 'success',
        'timestamp': DateTime.now().toIso8601String(),
        'collections': backup.keys.toList(),
      };
    } catch (e) {
      return {
        'status': 'error',
        'timestamp': DateTime.now().toIso8601String(),
        'error': e.toString(),
      };
    }
  }

  Future<List<Map<String, dynamic>>> getBackupsList() async {
    final backups = await _db
        .collection('backups')
        .orderBy('timestamp', descending: true)
        .get();

    return backups.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList();
  }

  Future<void> deleteBackup(String backupId) async {
    // Elimina il file dallo Storage
    await _storage.ref('backups/$backupId.json').delete();

    // Elimina il record dal database
    await _db.collection('backups').doc(backupId).delete();
  }

  Future<void> scheduleAutomaticBackup({
    required Duration interval,
    required int maxBackups,
  }) async {
    // Implementare la logica per i backup automatici
    // Potrebbe essere gestito tramite Cloud Functions
  }
}
