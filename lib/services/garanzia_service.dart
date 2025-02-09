import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/garanzia.dart';
import '../services/notification_service.dart';

class GaranziaService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final NotificationService _notificationService;

  GaranziaService(this._notificationService);

  Future<GaranziaInfo?> getGaranzia(String id) async {
    try {
      // Implement your garanzia fetching logic here
      // This is just a placeholder implementation
      return null;
    } catch (e) {
      print('Error getting garanzia: $e');
      return null;
    }
  }

  // Stream delle garanzie con possibilità di filtraggio
  Stream<List<Garanzia>> getGaranzie({bool? soloAttive}) {
    var query = _db.collection('garanzie').orderBy('dataFine');

    if (soloAttive == true) {
      final now = DateTime.now();
      query = query
          .where('dataFine',
              isGreaterThan:
                  now) // Corretto da dataScadenza a dataFine per match con il modello
          .where('stato', isEqualTo: StatoGaranzia.attiva.toString());
    }

    return query.snapshots().map((snapshot) => snapshot.docs
        .map((doc) => Garanzia.fromMap({...doc.data(), 'id': doc.id}))
        .toList());
  }

  // Metodi aggiunti per supportare l'interfaccia usata in GaranzieScreen
  Stream<List<Garanzia>> getGaranzieAttive() {
    return getGaranzie(soloAttive: true);
  }

  Stream<List<Garanzia>> getAllGaranzie() {
    return getGaranzie();
  }

  // Registra una nuova garanzia con i parametri richiesti
  Future<void> registraGaranzia({
    required String riparazioneId,
    required String clienteId,
    required String dispositivo,
    required int durataGiorniGaranzia,
    required List<String> componentiCoperti,
    String? note,
  }) async {
    final now = DateTime.now();
    final garanzia = Garanzia(
      id: '', // sarà generato da Firestore
      prodotto: dispositivo,
      riparazioneId: riparazioneId,
      clienteId: clienteId,
      dispositivo: dispositivo,
      dataInizio: now,
      dataFine: now.add(Duration(days: durataGiorniGaranzia)),
      stato: StatoGaranzia.attiva,
      note: note,
      createdAt: now,
      updatedAt: now,
      componentiCoperti: componentiCoperti,
    );

    await addGaranzia(garanzia);
  }

  Future<Garanzia> getGaranziaById(String id) async {
    final doc = await _db.collection('garanzie').doc(id).get();
    if (!doc.exists) {
      throw Exception('Garanzia non trovata');
    }
    return Garanzia.fromMap({...doc.data()!, 'id': doc.id});
  }

  Future<void> _scheduleNotificaScadenza(Garanzia garanzia) async {
    final dataNotifica = garanzia.dataFine.subtract(const Duration(days: 7));

    await _notificationService.scheduleNotification(
      id: garanzia.hashCode,
      title: 'Scadenza Garanzia',
      body: 'La garanzia per ${garanzia.prodotto} sta per scadere',
      scheduledDate: dataNotifica,
      payload: '/garanzie/${garanzia.id}',
    );
  }

  // Aggiorna una garanzia esistente
  Future<void> updateGaranzia(Garanzia garanzia) async {
    await _db.collection('garanzie').doc(garanzia.id).update(garanzia.toMap());

    await _scheduleNotificaScadenza(garanzia);
  }

  // Elimina una garanzia
  Future<void> deleteGaranzia(String id) async {
    await _db.collection('garanzie').doc(id).delete();
    await _notificationService.cancelNotification(id.hashCode);
  }

  // Invalida una garanzia
  Future<void> invalidaGaranzia(String garanziaId, String motivo) async {
    await _db.collection('garanzie').doc(garanziaId).update({
      'stato': StatoGaranzia.invalidata.toString(),
      'motivazioneInvalidazione': motivo,
      'dataInvalidazione': FieldValue.serverTimestamp(),
    });
  }

  // Aggiorna le note di una garanzia
  Future<void> updateNote(String garanziaId, String note) async {
    await _db.collection('garanzie').doc(garanziaId).update({
      'note': note,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  // Ottieni statistiche garanzie
  Stream<Map<String, int>> getStatisticheGaranzie() {
    return _db.collection('garanzie').snapshots().map((snapshot) {
      final total = snapshot.docs.length;
      final active = snapshot.docs
          .where(
              (doc) => doc.data()['stato'] == StatoGaranzia.attiva.toString())
          .length;
      final inScadenza = snapshot.docs.where((doc) {
        if (doc.data()['stato'] != StatoGaranzia.attiva.toString())
          return false;
        final scadenza = (doc.data()['dataFine'] as Timestamp).toDate();
        final now = DateTime.now();
        final giorniAllaScadenza = scadenza.difference(now).inDays;
        return giorniAllaScadenza <= 30 && giorniAllaScadenza > 0;
      }).length;
      final scadute = snapshot.docs.where((doc) {
        final scadenza = (doc.data()['dataFine'] as Timestamp).toDate();
        return scadenza.isBefore(DateTime.now());
      }).length;

      return {
        'totale': total,
        'attive': active,
        'inScadenza': inScadenza,
        'scadute': scadute,
      };
    });
  }
}
