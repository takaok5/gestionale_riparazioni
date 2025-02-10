import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import 'enums/enums.dart';

class OrdiniService {
  final FirebaseFirestore _db;
  final String collectionName = 'ordini';

  OrdiniService(this._db);

  Stream<List<Ordine>> getOrdiniStream({
    required String userId,
    StatoOrdine? stato,
    String? fornitoreId,
  }) {
    Query query =
        _db.collection(collectionName).where('userId', isEqualTo: userId);

    if (stato != null) {
      query = query.where('stato', isEqualTo: stato.index);
    }

    if (fornitoreId != null) {
      query = query.where('fornitoreId', isEqualTo: fornitoreId);
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return OrdineRicambi.fromMap({
          'id': doc.id,
          ...doc.data() as Map<String, dynamic>,
        });
      }).toList();
    });
  }

  Future<void> createOrdine(Ordine ordine) async {
    await _db.collection(collectionName).doc(ordine.id).set(ordine.toMap());
  }

  Future<void> updateOrdine(Ordine ordine) async {
    await _db.collection(collectionName).doc(ordine.id).update(ordine.toMap());
  }

  Future<void> deleteOrdine(String id) async {
    await _db.collection(collectionName).doc(id).delete();
  }

  Future<Map<String, dynamic>> getStatisticheFornitori() async {
    final QuerySnapshot snapshot = await _db.collection(collectionName).get();

    Map<String, dynamic> statistiche = {};

    for (var doc in snapshot.docs) {
      final ordine = Ordine.fromMap({
        'id': doc.id,
        ...doc.data() as Map<String, dynamic>,
      });

      if (!statistiche.containsKey(ordine.fornitoreId)) {
        statistiche[ordine.fornitoreId] = {
          'nome': ordine.fornitoreNome,
          'totaleOrdini': 0,
          'totaleSpesa': 0.0,
        };
      }

      statistiche[ordine.fornitoreId]['totaleOrdini']++;
      statistiche[ordine.fornitoreId]['totaleSpesa'] += ordine.totale;
    }

    return statistiche;
  }
}
