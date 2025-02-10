import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:path/path.dart' as path;
import '../utils/date_utils.dart' show AppDateUtils;

class FirebaseStorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Costanti per i percorsi di storage
  static const String FOLDER_IMAGES = 'images';
  static const String FOLDER_DOCUMENTS = 'documents';
  static const String FOLDER_ATTACHMENTS = 'attachments';

  /// Upload file con organizzazione temporale e metadati
  Future<String> uploadFile(File file, String folder) async {
    final now = AppDateUtils.getCurrentDateTime();
    final fileName = path.basename(file.path);

    // Organizza i file in cartelle per anno/mese
    final yearMonth = AppDateUtils.formatYearMonth(now);
    final destination = '$folder/$yearMonth/$fileName';

    // Aggiungi timestamp al nome del file se necessario
    final String timestampedFileName = _addTimestampToFilename(fileName, now);
    final String finalDestination = '$folder/$yearMonth/$timestampedFileName';

    // Prepara i metadati del file
    final metadata = SettableMetadata(
      customMetadata: {
        'uploadDate': AppDateUtils.formatDateTime(now),
        'uploadTimestamp': AppDateUtils.toUtc(now).toIso8601String(),
        'yearMonth': yearMonth,
        'originalFilename': fileName,
      },
      contentType: _getContentType(fileName),
    );

    final ref = _storage.ref().child(finalDestination);
    final uploadTask = ref.putFile(file, metadata);
    final snapshot = await uploadTask.whenComplete(() {});

    // Restituisci l'URL del file caricato
    return await snapshot.ref.getDownloadURL();
  }

  /// Upload di file multipli mantenendo l'ordine temporale
  Future<List<String>> uploadMultipleFiles(
      List<File> files, String folder) async {
    final now = AppDateUtils.getCurrentDateTime();
    final yearMonth = AppDateUtils.formatYearMonth(now);
    final List<String> uploadedUrls = [];

    for (var file in files) {
      final fileName = path.basename(file.path);
      final timestampedFileName = _addTimestampToFilename(fileName, now);
      final destination = '$folder/$yearMonth/$timestampedFileName';

      final metadata = SettableMetadata(
        customMetadata: {
          'uploadDate': AppDateUtils.formatDateTime(now),
          'uploadTimestamp': AppDateUtils.toUtc(now).toIso8601String(),
          'yearMonth': yearMonth,
          'originalFilename': fileName,
          'uploadSequence': '${uploadedUrls.length + 1}/${files.length}',
        },
        contentType: _getContentType(fileName),
      );

      final ref = _storage.ref().child(destination);
      final uploadTask = ref.putFile(file, metadata);
      final snapshot = await uploadTask.whenComplete(() {});
      final url = await snapshot.ref.getDownloadURL();
      uploadedUrls.add(url);
    }

    return uploadedUrls;
  }

  /// Elimina un file e registra l'operazione
  Future<void> deleteFile(String url) async {
    try {
      final ref = _storage.refFromURL(url);
      final metadata = await ref.getMetadata();
      final now = AppDateUtils.getCurrentDateTime();

      // Registra i metadati di eliminazione
      final deletionMetadata = {
        'deletedAt': AppDateUtils.formatDateTime(now),
        'deletionTimestamp': AppDateUtils.toUtc(now).toIso8601String(),
        'originalUploadDate': metadata.customMetadata?['uploadDate'],
        'filePath': ref.fullPath,
      };

      await ref.delete();

      // Qui potresti voler salvare deletionMetadata in un log o database
    } catch (e) {
      print('Errore durante l\'eliminazione del file: $e');
      throw e;
    }
  }

  /// Ottieni lista dei file in una cartella per un periodo specifico
  Future<List<Reference>> getFilesByPeriod(
    String folder,
    DateTime startDate,
    DateTime endDate,
  ) async {
    final List<Reference> files = [];
    final startYearMonth = AppDateUtils.formatYearMonth(startDate);
    final endYearMonth = AppDateUtils.formatYearMonth(endDate);

    final ListResult result = await _storage.ref(folder).listAll();

    for (var item in result.items) {
      try {
        final metadata = await item.getMetadata();
        final uploadDate = metadata.customMetadata?['uploadDate'];

        if (uploadDate != null) {
          final fileDate = DateTime.parse(uploadDate);
          if (fileDate.isAfter(startDate) && fileDate.isBefore(endDate)) {
            files.add(item);
          }
        }
      } catch (e) {
        print('Errore nel recupero dei metadati per ${item.fullPath}: $e');
      }
    }

    return files;
  }

  /// Utility per aggiungere timestamp al nome del file
  String _addTimestampToFilename(String fileName, DateTime timestamp) {
    final extension = path.extension(fileName);
    final nameWithoutExtension = path.basenameWithoutExtension(fileName);
    final timeString = AppDateUtils.formatFileTimestamp(timestamp);
    return '${nameWithoutExtension}_$timeString$extension';
  }

  /// Utility per determinare il content type
  String _getContentType(String fileName) {
    final ext = path.extension(fileName).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.pdf':
        return 'application/pdf';
      case '.doc':
      case '.docx':
        return 'application/msword';
      default:
        return 'application/octet-stream';
    }
  }
}
