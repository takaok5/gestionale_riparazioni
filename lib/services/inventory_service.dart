import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ricambio.dart';
import '../models/categoria.dart';
import '../models/movimento_magazzino.dart';
import '../services/app_context_service.dart';
import 'base_service.dart';

class InventoryService extends BaseService {
  final FirebaseFirestore _firestore;
  final AppContextService _appContext;

  InventoryService(AppContextService appContext)
      : _firestore = FirebaseFirestore.instance,
        _appContext = appContext,
        super('ricambi');
  @override
  Future<void> initialize() async {
    // Implementazione dell'inizializzazione
  }

  @override
  Future<void> dispose() async {
    // Implementazione della pulizia
  }

  // Ricambi
  Stream<List<Ricambio>> getRicambi() {
    return _firestore
        .collection('ricambi')
        .snapshots()
        .asyncMap((snapshot) async {
      final ricambi = <Ricambio>[];

      for (var doc in snapshot.docs) {
        final categoriaId = doc.data()['categoriaId'] as String;
        final categoriaDoc =
            await _firestore.collection('categorie').doc(categoriaId).get();

        if (categoriaDoc.exists) {
          final categoria = Categoria.fromMap({
            ...categoriaDoc.data()!,
            'id': categoriaDoc.id,
          });

          ricambi.add(Ricambio.fromMap(
            {...doc.data(), 'id': doc.id},
            categoria: categoria,
          ));
        }
      }

      return ricambi;
    });
  }

  Future<List<Ricambio>> getRicambiSottoScorta() async {
    final snapshot = await _firestore.collection('ricambi').get();

    final ricambi = <Ricambio>[];

    for (var doc in snapshot.docs) {
      final categoriaId = doc.data()['categoriaId'] as String;
      final categoriaDoc =
          await _firestore.collection('categorie').doc(categoriaId).get();

      if (categoriaDoc.exists) {
        final categoria = Categoria.fromMap({
          ...categoriaDoc.data()!,
          'id': categoriaDoc.id,
        });

        final ricambio = Ricambio.fromMap(
          {...doc.data(), 'id': doc.id},
          categoria: categoria,
        );

        if (ricambio.sottoScorta) {
          ricambi.add(ricambio);
        }
      }
    }

    return ricambi;
  }

  Future<double> calcolaValoreMagazzino() async {
    final ricambi = await _firestore.collection('ricambi').get();
    return ricambi.docs.fold<double>(
      0,
      (double sum, doc) {
        final ricambio = Ricambio.fromMap(
          {...doc.data(), 'id': doc.id},
          categoria: Categoria(
            id: '',
            nome: '',
            descrizione: null,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        return sum + (ricambio.prezzoAcquisto * ricambio.quantita);
      },
    );
  }

  Future<double> getValoreTotaleMagazzino() async {
    final ricambi = await _firestore.collection('ricambi').get();
    double totale = 0;

    for (var doc in ricambi.docs) {
      final ricambio = Ricambio.fromMap(
        {...doc.data(), 'id': doc.id},
        categoria: Categoria(id: '', nome: '', descrizione: null),
      );
      totale += ricambio.prezzoAcquisto * ricambio.quantita;
    }

    return totale;
  }

  // Categorie
  Stream<List<Categoria>> getCategorie() {
    return _firestore.collection('categorie').orderBy('nome').snapshots().map(
        (snapshot) => snapshot.docs
            .map((doc) => Categoria.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }

  // Movimenti Magazzino
  Future<void> addMovimento(MovimentoMagazzino movimento) async {
    final batch = _firestore.batch();

    // Aggiungi il movimento
    final movimentoRef = _firestore.collection('movimenti').doc();
    batch.set(movimentoRef, movimento.toMap());

    // Aggiorna la quantità del ricambio
    final ricambioRef =
        _firestore.collection('ricambi').doc(movimento.ricambioId);
    final quantitaAggiornata = movimento.tipo == TipoMovimento.carico
        ? FieldValue.increment(movimento.quantita)
        : FieldValue.increment(-movimento.quantita);

    batch.update(ricambioRef, {
      'quantita': quantitaAggiornata,
      'updatedAt': DateTime.now().toIso8601String(),
    });

    try {
      await batch.commit();
    } catch (e) {
      // Gestione degli errori
      print('Errore durante l\'aggiornamento del movimento: $e');
      rethrow;
    }
  }

  Stream<List<MovimentoMagazzino>> getMovimentiRecenti() {
    return _firestore
        .collection('movimenti')
        .orderBy('createdAt', descending: true)
        .limit(50)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                MovimentoMagazzino.fromMap({...doc.data(), 'id': doc.id}))
            .toList());
  }
}
