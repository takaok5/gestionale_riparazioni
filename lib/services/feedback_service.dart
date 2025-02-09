import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/feedback_cliente.dart';

class FeedbackService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> addFeedback(FeedbackCliente feedback) async {
    await _db.collection('feedback').doc(feedback.id).set(feedback.toMap());

    // Aggiorna le statistiche del feedback
    await _updateFeedbackStats(feedback);
  }

  Future<void> _updateFeedbackStats(FeedbackCliente feedback) async {
    final statsRef = _db.collection('statistiche').doc('feedback');

    await _db.runTransaction((transaction) async {
      final statsDoc = await transaction.get(statsRef);

      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          'totaleFeedback': 1,
          'mediaValutazioni': feedback.valutazione,
          'distribuzione': {
            '1': feedback.valutazione == 1 ? 1 : 0,
            '2': feedback.valutazione == 2 ? 1 : 0,
            '3': feedback.valutazione == 3 ? 1 : 0,
            '4': feedback.valutazione == 4 ? 1 : 0,
            '5': feedback.valutazione == 5 ? 1 : 0,
          }
        });
      } else {
        final currentStats = statsDoc.data()!;
        final totaleFeedback = currentStats['totaleFeedback'] as int;
        final mediaAttuale = currentStats['mediaValutazioni'] as double;
        final distribuzione =
            Map<String, int>.from(currentStats['distribuzione']);

        // Aggiorna la distribuzione
        distribuzione[feedback.valutazione.toString()] =
            (distribuzione[feedback.valutazione.toString()] ?? 0) + 1;

        // Calcola la nuova media
        final nuovaMedia =
            ((mediaAttuale * totaleFeedback) + feedback.valutazione) /
                (totaleFeedback + 1);

        transaction.update(statsRef, {
          'totaleFeedback': totaleFeedback + 1,
          'mediaValutazioni': nuovaMedia,
          'distribuzione': distribuzione,
        });
      }
    });
  }

  Stream<List<FeedbackCliente>> getFeedbackForDisplay() {
    return _db
        .collection('feedback')
        .where('pubblicabile', isEqualTo: true)
        .orderBy('data', descending: true)
        .limit(10)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => FeedbackCliente.fromMap(doc.data()))
            .toList());
  }

  Future<Map<String, dynamic>> getFeedbackStats() async {
    final statsDoc = await _db.collection('statistiche').doc('feedback').get();
    return statsDoc.data() ??
        {
          'totaleFeedback': 0,
          'mediaValutazioni': 0.0,
          'distribuzione': {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
          }
        };
  }
}
