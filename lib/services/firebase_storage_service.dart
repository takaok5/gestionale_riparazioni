import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:path/path.dart' as path;

class FirebaseStorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;

  Future<String> uploadFile(File file, String folder) async {
    final fileName = path.basename(file.path);
    final destination = '$folder/$fileName';

    final ref = _storage.ref().child(destination);
    final uploadTask = ref.putFile(file);
    final snapshot = await uploadTask.whenComplete(() {});

    return await snapshot.ref.getDownloadURL();
  }

  Future<void> deleteFile(String url) async {
    try {
      final ref = _storage.refFromURL(url);
      await ref.delete();
    } catch (e) {
      print('Errore durante l\'eliminazione del file: $e');
    }
  }
}
