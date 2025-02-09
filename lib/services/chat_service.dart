import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/messaggio.dart';
import 'dart:io';

class ChatService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Invia un messaggio
  Future<void> inviaMessaggio({
    required String mittente,
    required String destinatario,
    required String contenuto,
    File? allegato,
    String? riparazioneId,
  }) async {
    String? urlAllegato;

    if (allegato != null) {
      urlAllegato = await _uploadAllegato(allegato);
    }

    final messaggio = Messaggio(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      mittente: mittente,
      destinatario: destinatario,
      contenuto: contenuto,
      timestamp: DateTime.now(),
      urlAllegato: urlAllegato,
      riparazioneId: riparazioneId,
      letto: false,
    );

    await _db.collection('messaggi').doc(messaggio.id).set(messaggio.toMap());

    // Aggiorna l'ultima attività della chat
    await _updateChatActivity(mittente, destinatario, contenuto);
  }

  Future<String> _uploadAllegato(File file) async {
    final String fileName = DateTime.now().millisecondsSinceEpoch.toString();
    final Reference ref = _storage.ref('chat_allegati/$fileName');
    await ref.putFile(file);
    return await ref.getDownloadURL();
  }

  Future<void> _updateChatActivity(
    String utente1,
    String utente2,
    String ultimoMessaggio,
  ) async {
    final chatId = _getChatId(utente1, utente2);

    await _db.collection('chat_activity').doc(chatId).set({
      'partecipanti': [utente1, utente2],
      'ultimoMessaggio': ultimoMessaggio,
      'ultimoAggiornamento': DateTime.now().toIso8601String(),
      'messaggiNonLetti': FieldValue.increment(1),
    }, SetOptions(merge: true));
  }

  String _getChatId(String utente1, String utente2) {
    final utenti = [utente1, utente2]..sort();
    return '${utenti[0]}_${utenti[1]}';
  }

  // Ottieni messaggi di una chat
  Stream<List<Messaggio>> getMessaggi(String utente1, String utente2) {
    return _db
        .collection('messaggi')
        .where('partecipanti', arrayContainsAny: [utente1, utente2])
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Messaggio.fromMap(doc.data())).toList());
  }

  // Segna i messaggi come letti
  Future<void> segnaMessaggiComeLetti(
      String mittente, String destinatario) async {
    final batch = _db.batch();
    final messaggi = await _db
        .collection('messaggi')
        .where('mittente', isEqualTo: mittente)
        .where('destinatario', isEqualTo: destinatario)
        .where('letto', isEqualTo: false)
        .get();

    for (var doc in messaggi.docs) {
      batch.update(doc.reference, {'letto': true});
    }

    await batch.commit();

    // Aggiorna il contatore dei messaggi non letti
    final chatId = _getChatId(mittente, destinatario);
    await _db.collection('chat_activity').doc(chatId).update({
      'messaggiNonLetti': 0,
    });
  }

  // Ottieni chat attive
  Stream<List<Map<String, dynamic>>> getChatAttive(String utente) {
    return _db
        .collection('chat_activity')
        .where('partecipanti', arrayContains: utente)
        .orderBy('ultimoAggiornamento', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => doc.data()).toList());
  }
}
