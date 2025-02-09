import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/garanzia.dart';
import '../services/notification_service.dart';

class GaranziaService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final NotificationService _notificationService;

  GaranziaService(this._notificationService);

  // Stream delle garanzie con possibilità di filtraggio
  Stream<List<Garanzia>> getGaranzie({bool? soloAttive}) {
    var query = _db.collection('garanzie').orderBy('dataFine');

    if (soloAttive == true) {
      final now = DateTime.now();
      query = query
          .where('dataScadenza', isGreaterThan: now)
          .where('stato', isEqualTo: 'attiva');
    }

    return query.snapshots().map((snapshot) => snapshot.docs
        .map((doc) => Garanzia.fromMap({...doc.data(), 'id': doc.id}))
        .toList());
  }

  // Registra una nuova garanzia
  Future<void> addGaranzia(Garanzia garanzia) async {
    final doc = await _db.collection('garanzie').add(garanzia.toMap());
    await _scheduleNotificaScadenza(garanzia.copyWith(id: doc.id));
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
      'stato': 'invalidata',
      'motivoInvalidazione': motivo,
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
  Stream<Map<String, dynamic>> getStatisticheGaranzie() {
    return _db.collection('garanzie').snapshots().map((snapshot) {
      final total = snapshot.docs.length;
      final active =
          snapshot.docs.where((doc) => doc.data()['stato'] == 'attiva').length;
      final expired = snapshot.docs.where((doc) {
        final scadenza = (doc.data()['dataScadenza'] as Timestamp).toDate();
        return scadenza.isBefore(DateTime.now());
      }).length;

      return {
        'totale': total,
        'attive': active,
        'scadute': expired,
        'percentualeAttive':
            total > 0 ? (active / total * 100).toStringAsFixed(1) : '0',
      };
    });
  }
}
