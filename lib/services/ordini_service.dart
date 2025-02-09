import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import '../models/enums.dart';

class OrdiniService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Stream<List<Ordine>> getOrdini() {
    return _firestore
        .collection('ordini')
        .orderBy('dataOrdine', descending: true)
        .snapshots()
        .asyncMap((snapshot) async {
      final ordini = <Ordine>[];
      for (var doc in snapshot.docs) {
        final fornitoreId = doc.data()['fornitoreId'] as String;
        final fornitoreDoc =
            await _firestore.collection('fornitori').doc(fornitoreId).get();

        if (fornitoreDoc.exists) {
          final fornitore = Fornitore.fromMap({
            ...fornitoreDoc.data()!,
            'id': fornitoreDoc.id,
          });

          ordini.add(Ordine.fromMap({
            ...doc.data(),
            'id': doc.id,
          }, fornitore: fornitore));
        }
      }
      return ordini;
    });
  }

  Future<void> addOrdine(Ordine ordine) {
    return _firestore.collection('ordini').add(ordine.toMap());
  }

  Future<void> updateOrdine(Ordine ordine) {
    return _firestore
        .collection('ordini')
        .doc(ordine.id)
        .update(ordine.toMap());
  }

  Future<void> updateStatoOrdine(String ordineId, StatoOrdine nuovoStato) {
    return _firestore
        .collection('ordini')
        .doc(ordineId)
        .update({'stato': nuovoStato.toString()});
  }

  Stream<Map<String, dynamic>> getStatisticheOrdini() {
    return _firestore.collection('ordini').snapshots().map((snapshot) {
      double totaleOrdini = 0;
      int ordiniInAttesa = 0;
      int ordiniCompletati = 0;

      for (var doc in snapshot.docs) {
        final stato = StatoOrdine.values.firstWhere(
          (s) => s.toString() == doc.data()['stato'],
        );

        if (stato == StatoOrdine.inAttesa) {
          ordiniInAttesa++;
        } else if (stato == StatoOrdine.consegnato) {
          ordiniCompletati++;
        }
      }

      return {
        'totaleOrdini': totaleOrdini,
        'ordiniInAttesa': ordiniInAttesa,
        'ordiniCompletati': ordiniCompletati,
        'spesaTotale': totaleOrdini,
        'tempoMedioConsegna': 0, // TODO: implementare il calcolo
      };
    });
  }
}
