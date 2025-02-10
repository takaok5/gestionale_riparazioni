import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:convert';
import '../utils/date_utils.dart' show AppDateUtils;

class BackupService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  
  // Configurazione backup
  static const int _maxBackupsPerDay = 3;
  static const int _backupRetentionDays = 30;
  
  // Singleton pattern
  static final BackupService _instance = BackupService._internal();
  factory BackupService() => _instance;
  BackupService._internal();

  Future<void> createBackup({String? description}) async {
    try {
      final now = AppDateUtils.getCurrentDateTime();
      final timestamp = AppDateUtils.formatDateTime(now);
      final backupFileName = '${AppDateUtils.formatFileTimestamp(now)}.json';
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
      final backupRef = _storage.ref('backups/$backupFileName');
      await backupRef.putString(backupJson);

      // Registra il backup nel database
      await _db.collection('backups').add({
        'timestamp': AppDateUtils.toUtc(now),
        'timestampFormatted': timestamp,
        'fileName': backupFileName,
        'size': backupJson.length,
        'collections': collections,
        'status': 'completed',
        'description': description,
        'expiresAt': AppDateUtils.toUtc(
            AppDateUtils.addDays(now, _backupRetentionDays)),
        'retentionDays': _backupRetentionDays,
      });

      // Pulisci i backup vecchi
      await _cleanupOldBackups();
      
    } catch (e) {
      final errorTime = AppDateUtils.getCurrentDateTime();
      await _db.collection('backups').add({
        'timestamp': AppDateUtils.toUtc(errorTime),
        'timestampFormatted': AppDateUtils.formatDateTime(errorTime),
        'error': e.toString(),
        'status': 'failed',
      });
      rethrow;
    }
  }

  Future<Map<String, dynamic>> restoreBackup(String backupId) async {
    try {
      final now = AppDateUtils.getCurrentDateTime();
      
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
          doc['restored_at'] = AppDateUtils.toUtc(now);
          doc['restored_at_formatted'] = AppDateUtils.formatDateTime(now);
          batch.set(collectionRef.doc(docId), doc);
        }

        await batch.commit();
      }

      return {
        'status': 'success',
        'timestamp': AppDateUtils.toUtc(now),
        'timestampFormatted': AppDateUtils.formatDateTime(now),
        'collections': backup.keys.toList(),
      };
    } catch (e) {
      final errorTime = AppDateUtils.getCurrentDateTime();
      return {
        'status': 'error',
        'timestamp': AppDateUtils.toUtc(errorTime),
        'timestampFormatted': AppDateUtils.formatDateTime(errorTime),
        'error': e.toString(),
      };
    }
  }

  Future<List<Map<String, dynamic>>> getBackupsList({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    var query = _db.collection('backups')
        .orderBy('timestamp', descending: true);
    
    if (startDate != null) {
      query = query.where('timestamp', 
          isGreaterThanOrEqualTo: AppDateUtils.toUtc(startDate));
    }
    
    if (endDate != null) {
      query = query.where('timestamp', 
          isLessThanOrEqualTo: AppDateUtils.toUtc(endDate));
    }
    
    final backups = await query.get();
    
    return backups.docs.map((doc) {
      final data = doc.data();
      return {
        'id': doc.id,
        ...data,
        'ageInDays': AppDateUtils.daysSince(
            (data['timestamp'] as Timestamp).toDate()),
        'formattedAge': AppDateUtils.formatDuration(
            AppDateUtils.getCurrentDateTime().difference(
                (data['timestamp'] as Timestamp).toDate())),
      };
    }).toList();
  }

  Future<void> deleteBackup(String backupId) async {
    // Ottieni il record del backup
    final backupDoc = await _db.collection('backups').doc(backupId).get();
    if (!backupDoc.exists) {
      throw Exception('Backup non trovato');
    }

    // Elimina il file dallo Storage
    final fileName = backupDoc.data()?['fileName'];
    if (fileName != null) {
      await _storage.ref('backups/$fileName').delete();
    }

    // Registra l'eliminazione
    final now = AppDateUtils.getCurrentDateTime();
    await _db.collection('backup_logs').add({
      'action': 'delete',
      'backupId': backupId,
      'timestamp': AppDateUtils.toUtc(now),
      'timestampFormatted': AppDateUtils.formatDateTime(now),
      'fileName': fileName,
    });

    // Elimina il record dal database
    await _db.collection('backups').doc(backupId).delete();
  }

  Future<void> scheduleAutomaticBackup({
    required Duration interval,
    String? description,
  }) async {
    final now = AppDateUtils.getCurrentDateTime();
    
    // Verifica se è possibile eseguire un nuovo backup
    final todayBackups = await _db
        .collection('backups')
        .where('timestamp', 
            isGreaterThanOrEqualTo: AppDateUtils.toUtc(
                AppDateUtils.startOfDay(now)))
        .where('timestamp', 
            isLessThanOrEqualTo: AppDateUtils.toUtc(
                AppDateUtils.endOfDay(now)))
        .get();

    if (todayBackups.docs.length >= _maxBackupsPerDay) {
      throw Exception(
          'Limite massimo di backup giornalieri raggiunto ($_maxBackupsPerDay)');
    }

    // Crea il backup con descrizione automatica
    final autoDescription = description ?? 
        'Backup automatico - ${AppDateUtils.formatDateTime(now)}';
    await createBackup(description: autoDescription);
  }

  // Metodi privati di utilità

  Future<void> _cleanupOldBackups() async {
    final now = AppDateUtils.getCurrentDateTime();
    final expirationDate = AppDateUtils.subtractDays(now, _backupRetentionDays);

    final expiredBackups = await _db
        .collection('backups')
        .where('timestamp', isLessThan: AppDateUtils.toUtc(expirationDate))
        .where('status', isEqualTo: 'completed')
        .get();

    for (var backup in expiredBackups.docs) {
      await deleteBackup(backup.id);
    }
  }

  Future<Map<String, dynamic>> getBackupStats() async {
    final now = AppDateUtils.getCurrentDateTime();
    final backups = await getBackupsList();
    
    return {
      'totalBackups': backups.length,
      'oldestBackup': backups.isNotEmpty ? backups.last['timestampFormatted'] : 'N/A',
      'newestBackup': backups.isNotEmpty ? backups.first['timestampFormatted'] : 'N/A',
      'backupsToday': backups.where((b) => 
          AppDateUtils.isSameDay(
              (b['timestamp'] as Timestamp).toDate(), now)).length,
      'backupsThisWeek': backups.where((b) => 
          AppDateUtils.isSameWeek(
              (b['timestamp'] as Timestamp).toDate(), now)).length,
      'backupsThisMonth': backups.where((b) => 
          AppDateUtils.isSameMonth(
              (b['timestamp'] as Timestamp).toDate(), now)).length,
      'nextScheduledBackup': _calculateNextBackupTime(backups),
      'retentionPolicy': '$_backupRetentionDays giorni',
      'maxDailyBackups': _maxBackupsPerDay,
    };
  }

  String _calculateNextBackupTime(List<Map<String, dynamic>> backups) {
    final now = AppDateUtils.getCurrentDateTime();
    final todayBackups = backups.where((b) => 
        AppDateUtils.isSameDay(
            (b['timestamp'] as Timestamp).toDate(), now)).length;
    
    if (todayBackups >= _maxBackupsPerDay) {
      final tomorrow = AppDateUtils.addDays(now, 1);
      return 'Domani - ${AppDateUtils.formatDate(tomorrow)}';
    }
    
    return 'Disponibile ora';
  }
}