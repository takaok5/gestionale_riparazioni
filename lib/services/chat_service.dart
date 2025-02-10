import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/messaggio.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import 'dart:io';

class ChatService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  static const int _messaggiLimite = 50;
  static const Duration _tempoScadenzaMessaggio = Duration(days: 30);

  // Invia un messaggio
  Future<void> inviaMessaggio({
    required String mittente,
    required String destinatario,
    required String contenuto,
    File? allegato,
    String? riparazioneId,
  }) async {
    String? urlAllegato;
    final now = AppDateUtils.getCurrentDateTime();

    if (allegato != null) {
      urlAllegato = await _uploadAllegato(allegato);
    }

    final messaggio = Messaggio(
      id: AppDateUtils
          .generateTimeBasedId(), // Metodo utility per generare ID basati sul tempo
      mittente: mittente,
      destinatario: destinatario,
      contenuto: contenuto,
      timestamp: now,
      timestampFormatted: AppDateUtils.formatDateTime(now),
      urlAllegato: urlAllegato,
      riparazioneId: riparazioneId,
      letto: false,
      scadenza: AppDateUtils.addDays(now, _tempoScadenzaMessaggio.inDays),
    );

    await _db.collection('messaggi').doc(messaggio.id).set(messaggio.toMap());

    // Aggiorna l'ultima attività della chat
    await _updateChatActivity(mittente, destinatario, contenuto, now);
  }

  Future<String> _uploadAllegato(File file) async {
    final String fileName = AppDateUtils.generateTimeBasedId();
    final Reference ref = _storage.ref('chat_allegati/$fileName');
    await ref.putFile(file);
    return await ref.getDownloadURL();
  }

  Future<void> _updateChatActivity(
    String utente1,
    String utente2,
    String ultimoMessaggio,
    DateTime timestamp,
  ) async {
    final chatId = _getChatId(utente1, utente2);

    await _db.collection('chat_activity').doc(chatId).set({
      'partecipanti': [utente1, utente2],
      'ultimoMessaggio': ultimoMessaggio,
      'timestamp': AppDateUtils.toUtc(timestamp),
      'timestampFormatted': AppDateUtils.formatDateTime(timestamp),
      'ultimoAggiornamento': AppDateUtils.toUtc(timestamp),
      'ultimoAggiornamentoFormatted': AppDateUtils.formatDateTime(timestamp),
      'messaggiNonLetti': FieldValue.increment(1),
      'prossimaScadenza': AppDateUtils.toUtc(
          AppDateUtils.addDays(timestamp, _tempoScadenzaMessaggio.inDays)),
    }, SetOptions(merge: true));
  }

  String _getChatId(String utente1, String utente2) {
    final utenti = [utente1, utente2]..sort();
    return '${utenti[0]}_${utenti[1]}';
  }

  // Ottieni messaggi di una chat con formattazione temporale
  Stream<List<Messaggio>> getMessaggi(String utente1, String utente2) {
    return _db
        .collection('messaggi')
        .where('partecipanti', arrayContainsAny: [utente1, utente2])
        .where('scadenza',
            isGreaterThan:
                AppDateUtils.toUtc(AppDateUtils.getCurrentDateTime()))
        .orderBy('scadenza')
        .orderBy('timestamp', descending: true)
        .limit(_messaggiLimite)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              final data = doc.data();
              final timestamp = (data['timestamp'] as Timestamp).toDate();
              return Messaggio.fromMap({
                ...data,
                'timestampFormatted': AppDateUtils.formatDateTime(timestamp),
                'tempoPassato': AppDateUtils.formatTimeAgo(timestamp),
              });
            }).toList());
  }

  // Segna i messaggi come letti con timestamp
  Future<void> segnaMessaggiComeLetti(
      String mittente, String destinatario) async {
    final now = AppDateUtils.getCurrentDateTime();
    final batch = _db.batch();

    final messaggi = await _db
        .collection('messaggi')
        .where('mittente', isEqualTo: mittente)
        .where('destinatario', isEqualTo: destinatario)
        .where('letto', isEqualTo: false)
        .get();

    for (var doc in messaggi.docs) {
      batch.update(doc.reference, {
        'letto': true,
        'lettoAl': AppDateUtils.toUtc(now),
        'lettoAlFormatted': AppDateUtils.formatDateTime(now),
      });
    }

    await batch.commit();

    // Aggiorna il contatore e l'ultimo aggiornamento
    final chatId = _getChatId(mittente, destinatario);
    await _db.collection('chat_activity').doc(chatId).update({
      'messaggiNonLetti': 0,
      'ultimaLettura': AppDateUtils.toUtc(now),
      'ultimaLetturaFormatted': AppDateUtils.formatDateTime(now),
    });
  }

  // Ottieni chat attive con informazioni temporali formattate
  Stream<List<Map<String, dynamic>>> getChatAttive(String utente) {
    final now = AppDateUtils.getCurrentDateTime();

    return _db
        .collection('chat_activity')
        .where('partecipanti', arrayContains: utente)
        .orderBy('ultimoAggiornamento', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              final data = doc.data();
              final timestamp =
                  (data['ultimoAggiornamento'] as Timestamp).toDate();
              return {
                ...data,
                'timestampFormatted': AppDateUtils.formatDateTime(timestamp),
                'tempoPassato': AppDateUtils.formatTimeAgo(timestamp),
                'attivitàOggi': AppDateUtils.isSameDay(timestamp, now),
                'giorniInattività': AppDateUtils.daysSince(timestamp),
              };
            }).toList());
  }

  // Nuovi metodi di utilità per la gestione temporale delle chat

  Future<void> eliminaMessaggiScaduti() async {
    final now = AppDateUtils.getCurrentDateTime();
    final batch = _db.batch();

    final messaggiScaduti = await _db
        .collection('messaggi')
        .where('scadenza', isLessThan: AppDateUtils.toUtc(now))
        .get();

    for (var doc in messaggiScaduti.docs) {
      batch.delete(doc.reference);
    }

    await batch.commit();
  }

  Future<Map<String, dynamic>> getChatStats(String chatId) async {
    final now = AppDateUtils.getCurrentDateTime();
    final chat = await _db.collection('chat_activity').doc(chatId).get();
    final data = chat.data() ?? {};

    return {
      'ultima_attività': AppDateUtils.formatDateTime(
          (data['ultimoAggiornamento'] as Timestamp).toDate()),
      'tempo_inattività': AppDateUtils.formatDuration(
          now.difference((data['ultimoAggiornamento'] as Timestamp).toDate())),
      'messaggi_non_letti': data['messaggiNonLetti'] ?? 0,
      'ultima_lettura': data['ultimaLetturaFormatted'] ?? 'Mai',
      'prossima_scadenza_messaggi': AppDateUtils.formatDateTime(
          (data['prossimaScadenza'] as Timestamp).toDate()),
    };
  }

  Future<Map<String, int>> getMessaggiPerGiorno(String chatId) async {
    final messaggi = await _db
        .collection('messaggi')
        .where('chatId', isEqualTo: chatId)
        .orderBy('timestamp')
        .get();

    Map<String, int> messaggiPerGiorno = {};

    for (var doc in messaggi.docs) {
      final timestamp = (doc.data()['timestamp'] as Timestamp).toDate();
      final giorno = AppDateUtils.formatDate(timestamp);
      messaggiPerGiorno[giorno] = (messaggiPerGiorno[giorno] ?? 0) + 1;
    }

    return messaggiPerGiorno;
  }
}
