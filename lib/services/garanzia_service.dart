import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/garanzia.dart';
import '../services/notification_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class GaranziaService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final NotificationService _notificationService;

  GaranziaService(this._notificationService);

  Future<void> addGaranziaInterna(GaranziaInterna garanzia) async {
    try {
      final doc = await _db.collection('garanzie').add(garanzia.toMap());
      await _scheduleNotificaScadenza(garanzia, doc.id);
    } catch (e) {
      print('Error adding garanzia: $e');
      throw e;
    }
  }

  Future<void> addGaranziaFornitore(GaranziaFornitore garanzia) async {
    try {
      final doc = await _db.collection('garanzie').add(garanzia.toMap());
      await _scheduleNotificaScadenza(garanzia, doc.id);
    } catch (e) {
      print('Error adding garanzia fornitore: $e');
      throw e;
    }
  }

  // Stream delle garanzie con possibilità di filtraggio
  Stream<List<Garanzia>> getGaranzie({bool? soloAttive}) {
    var query = _db.collection('garanzie').orderBy('dataFine');

    if (soloAttive == true) {
      final now = AppDateUtils.getCurrentDateTime();
      query = query
          .where('dataFine', isGreaterThan: Timestamp.fromDate(AppDateUtils.toUtc(now)))
          .where('stato', isEqualTo: StatoGaranzia.attiva.toString().split('.').last);
    }

    return query.snapshots().map((snapshot) => snapshot.docs.map((doc) {
          final data = doc.data();
          final tipo = TipoGaranzia.values.firstWhere(
            (e) => e.toString().split('.').last == data['tipo'],
            orElse: () => TipoGaranzia.interna,
          );

          switch (tipo) {
            case TipoGaranzia.interna:
              return GaranziaInterna.fromMap({...data, 'id': doc.id});
            case TipoGaranzia.fornitore:
              return GaranziaFornitore.fromMap({...data, 'id': doc.id});
          }
        }).toList());
  }

  Stream<List<Garanzia>> getGaranzieAttive() => getGaranzie(soloAttive: true);
  Stream<List<Garanzia>> getAllGaranzie() => getGaranzie();

  // Registra una nuova garanzia interna
  Future<void> registraGaranziaInterna({
    required String riparazioneId,
    required String clienteId,
    required String dispositivo,
    required int durataGiorniGaranzia,
    required List<String> componentiCoperti,
    String? seriale,
    String? note,
  }) async {
    final now = AppDateUtils.getCurrentDateTime();
    final dataFine = AppDateUtils.addDays(now, durataGiorniGaranzia);
    
    final garanzia = GaranziaInterna(
      id: '',  // sarà generato da Firestore
      numero: _generateNumeroGaranzia(),
      riparazioneId: riparazioneId,
      clienteId: clienteId,
      dispositivo: dispositivo,
      seriale: seriale,
      dataInizio: now,
      dataFine: dataFine,
      stato: StatoGaranzia.attiva,
      note: note,
      componentiCoperti: componentiCoperti,
      createdAt: now,
      updatedAt: now,
    );

    await addGaranziaInterna(garanzia);
  }

  String _generateNumeroGaranzia() {
    final now = AppDateUtils.getCurrentDateTime();
    final anno = now.year.toString();
    final progressivo = DateTime.now().millisecondsSinceEpoch.toString().substring(8);
    return 'GAR$anno$progressivo';
  }

  Future<Garanzia> getGaranziaById(String id) async {
    final doc = await _db.collection('garanzie').doc(id).get();
    if (!doc.exists) {
      throw Exception('Garanzia non trovata');
    }
    
    final data = doc.data()!;
    final tipo = TipoGaranzia.values.firstWhere(
      (e) => e.toString().split('.').last == data['tipo'],
      orElse: () => TipoGaranzia.interna,
    );

    switch (tipo) {
      case TipoGaranzia.interna:
        return GaranziaInterna.fromMap({...data, 'id': doc.id});
      case TipoGaranzia.fornitore:
        return GaranziaFornitore.fromMap({...data, 'id': doc.id});
    }
  }

  Future<void> _scheduleNotificaScadenza(Garanzia garanzia, String id) async {
    final dataNotifica = AppDateUtils.addDays(garanzia.dataFine, -7);
    final tipoGaranzia = garanzia is GaranziaInterna ? 'interna' : 'fornitore';

    String body;
    if (garanzia is GaranziaInterna) {
      body = 'La garanzia per ${garanzia.dispositivo} sta per scadere';
    } else if (garanzia is GaranziaFornitore) {
      body = 'La garanzia del fornitore ${garanzia.fornitore} sta per scadere';
    } else {
      body = 'Una garanzia sta per scadere';
    }

    await _notificationService.scheduleNotification(
      id: id.hashCode,
      title: 'Scadenza Garanzia',
      body: body,
      scheduledDate: dataNotifica,
      payload: '/garanzie/$id',
    );
  }

  Future<void> updateGaranzia(Garanzia garanzia) async {
    await _db.collection('garanzie').doc(garanzia.id).update({
      ...garanzia.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    await _scheduleNotificaScadenza(garanzia, garanzia.id);
  }

  Future<void> deleteGaranzia(String id) async {
    await _db.collection('garanzie').doc(id).delete();
    await _notificationService.cancelNotification(id.hashCode);
  }

  Future<void> invalidaGaranzia(String garanziaId, String motivo) async {
    final now = AppDateUtils.getCurrentDateTime();
    await _db.collection('garanzie').doc(garanziaId).update({
      'stato': StatoGaranzia.invalidata.toString().split('.').last,
      'motivazioneInvalidazione': motivo,
      'dataInvalidazione': Timestamp.fromDate(AppDateUtils.toUtc(now)),
      'updatedAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
    });
  }

  Future<void> updateNote(String garanziaId, String note) async {
    final now = AppDateUtils.getCurrentDateTime();
    await _db.collection('garanzie').doc(garanziaId).update({
      'note': note,
      'updatedAt': Timestamp.fromDate(AppDateUtils.toUtc(now)),
    });
  }

  Stream<Map<String, dynamic>> getStatisticheGaranzie() {
    return _db.collection('garanzie').snapshots().map((snapshot) {
      final now = AppDateUtils.getCurrentDateTime();
      final docs = snapshot.docs;

      int totale = docs.length;
      int attive = 0;
      int inScadenza = 0;
      int scadute = 0;
      Map<String, int> perTipo = {};

      for (var doc in docs) {
        final data = doc.data();
        final dataFine = AppDateUtils.fromTimestamp(data['dataFine'] as Timestamp);
        final stato = StatoGaranzia.values.firstWhere(
          (e) => e.toString().split('.').last == data['stato'],
          orElse: () => StatoGaranzia.invalidata,
        );
        final tipo = data['tipo'] as String;

        // Aggiorna conteggio per tipo
        perTipo[tipo] = (perTipo[tipo] ?? 0) + 1;

        if (stato == StatoGaranzia.attiva) {
          attive++;
          final giorniAllaScadenza = AppDateUtils.daysBetween(now, dataFine);
          if (giorniAllaScadenza <= 30 && giorniAllaScadenza > 0) {
            inScadenza++;
          }
        }

        if (dataFine.isBefore(now)) {
          scadute++;
        }
      }

      return {
        'totale': totale,
        'attive': attive,
        'inScadenza': inScadenza,
        'scadute': scadute,
        'perTipo': perTipo,
        'aggiornamentoAl': AppDateUtils.formatDateTime(now),
      };
    });
  }
}