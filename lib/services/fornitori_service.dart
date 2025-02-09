import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/fornitore.dart';
import '../models/ordine.dart';

class FornitoriService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<List<Fornitore>> getFornitori() {
    return _firestore
        .collection('fornitori')
        .orderBy('ragioneSociale')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Fornitore.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  Future<List<Ordine>> getOrdiniRecenti(String fornitoreId) async {
    final snapshot = await _firestore
        .collection('ordini')
        .where('fornitoreId', isEqualTo: fornitoreId)
        .orderBy('createdAt', descending: true)
        .limit(5)
        .get();

    return snapshot.docs
        .map((doc) => Ordine.fromMap({...doc.data(), 'id': doc.id}))
        .toList();
  }

  Future<void> aggiungiFornitore(Fornitore fornitore) {
    return _firestore.collection('fornitori').add(fornitore.toMap());
  }

  Future<void> aggiornaFornitore(Fornitore fornitore) {
    return _firestore
        .collection('fornitori')
        .doc(fornitore.id)
        .update(fornitore.toMap());
  }
}
