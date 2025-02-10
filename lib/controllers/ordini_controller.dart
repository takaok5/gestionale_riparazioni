import 'package:get/get.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import '../services/ordini_service.dart';
import '../enums/enums.dart';
import '../constants/app_constants.dart';
import 'dart:async';

/// Controller per la gestione degli ordini
class OrdiniController extends GetxController {
  final OrdiniService _ordiniService;
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  OrdiniController({
    OrdiniService? ordiniService,
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _ordiniService =
            ordiniService ?? OrdiniService(FirebaseFirestore.instance),
        _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance {
    _initController();
  }

  // Stato principale
  final RxList<Ordine> ordini = <Ordine>[].obs;
  final RxList<Ordine> ordiniFiltered = <Ordine>[].obs;
  final RxList<Fornitore> fornitori = <Fornitore>[].obs;
  final Rx<Ordine?> selectedOrdine = Rx<Ordine?>(null);
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  // Filtri
  final Rx<StatoOrdine?> filtroStato = Rx<StatoOrdine?>(null);
  final Rx<String?> filtroFornitoreId = Rx<String?>(null);
  final Rx<DateTime?> filtroDataDa = Rx<DateTime?>(null);
  final Rx<DateTime?> filtroDataA = Rx<DateTime?>(null);
  final RxBool mostraSoloUrgenti = false.obs;
  final RxString searchQuery = ''.obs;

  StreamSubscription<List<Ordine>>? _ordiniSubscription;
  StreamSubscription<QuerySnapshot>? _fornitoriSubscription;

  // Getter per l'ID dell'utente corrente
  String get currentUserId => _auth.currentUser?.uid ?? '';

  void _initController() {
    ever(filtroStato, (_) => _applicaFiltri());
    ever(filtroFornitoreId, (_) => _applicaFiltri());
    ever(filtroDataDa, (_) => _applicaFiltri());
    ever(filtroDataA, (_) => _applicaFiltri());
    ever(mostraSoloUrgenti, (_) => _applicaFiltri());
    debounce(searchQuery, (_) => _applicaFiltri(),
        time: const Duration(milliseconds: 300));
  }

  @override
  void onInit() {
    super.onInit();
    loadOrdini();
    _subscribeToFornitori();
  }

  @override
  void onClose() {
    _ordiniSubscription?.cancel();
    _fornitoriSubscription?.cancel();
    super.onClose();
  }

  void _subscribeToFornitori() {
    _fornitoriSubscription = _firestore
        .collection(AppConstants.COLLECTION_FORNITORI)
        .snapshots()
        .listen(
      (snapshot) {
        fornitori.value = snapshot.docs
            .map((doc) => Fornitore.fromMap(
                {'id': doc.id, ...doc.data() as Map<String, dynamic>}))
            .toList();
      },
      onError: (error) {
        this.error.value = 'Errore nel caricamento dei fornitori: $error';
      },
    );
  }

  /// Carica la lista degli ordini
  void loadOrdini() {
    if (currentUserId.isEmpty) {
      error.value = 'Utente non autenticato';
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      _ordiniSubscription = _ordiniService
          .getOrdiniStream(
        userId: currentUserId,
        stato: filtroStato.value,
        fornitoreId: filtroFornitoreId.value,
      )
          .listen(
        (ordiniList) {
          ordini.value = ordiniList;
          _applicaFiltri();
          isLoading.value = false;
        },
        onError: (e) {
          error.value = OrdineError.loadError(e.toString());
          isLoading.value = false;
        },
      );
    } catch (e) {
      error.value = OrdineError.loadError(e.toString());
      isLoading.value = false;
    }
  }

  void _applicaFiltri() {
    if (ordini.isEmpty) return;

    var risultatiFiltrati = List<Ordine>.from(ordini);

    if (filtroStato.value != null) {
      risultatiFiltrati = risultatiFiltrati
          .where((ordine) => ordine.stato == filtroStato.value)
          .toList();
    }

    if (filtroFornitoreId.value != null &&
        filtroFornitoreId.value!.isNotEmpty) {
      risultatiFiltrati = risultatiFiltrati
          .where((ordine) => ordine.fornitoreId == filtroFornitoreId.value)
          .toList();
    }

    if (filtroDataDa.value != null) {
      risultatiFiltrati = risultatiFiltrati
          .where((ordine) => ordine.dataOrdine.isAfter(filtroDataDa.value!))
          .toList();
    }

    if (filtroDataA.value != null) {
      risultatiFiltrati = risultatiFiltrati
          .where((ordine) => ordine.dataOrdine.isBefore(filtroDataA.value!))
          .toList();
    }

    if (mostraSoloUrgenti.value) {
      risultatiFiltrati =
          risultatiFiltrati.where((ordine) => ordine.isUrgente).toList();
    }

    if (searchQuery.value.isNotEmpty) {
      final query = searchQuery.value.toLowerCase();
      risultatiFiltrati = risultatiFiltrati.where((ordine) {
        return ordine.numero.toLowerCase().contains(query) ||
            ordine.descrizione.toLowerCase().contains(query) ||
            ordine.fornitoreNome.toLowerCase().contains(query);
      }).toList();
    }

    ordiniFiltered.value = risultatiFiltrati;
  }

  // Metodi per gestire i filtri
  void setFiltroStato(StatoOrdine? stato) => filtroStato.value = stato;
  void setFiltroFornitore(String? fornitoreId) =>
      filtroFornitoreId.value = fornitoreId;
  void setFiltroDate(DateTime? dataDa, DateTime? dataA) {
    filtroDataDa.value = dataDa;
    filtroDataA.value = dataA;
  }

  void setMostraSoloUrgenti(bool value) => mostraSoloUrgenti.value = value;
  void setSearchQuery(String query) => searchQuery.value = query;
  void resetFiltri() {
    filtroStato.value = null;
    filtroFornitoreId.value = null;
    filtroDataDa.value = null;
    filtroDataA.value = null;
    mostraSoloUrgenti.value = false;
    searchQuery.value = '';
  }

  /// Crea un nuovo ordine
  Future<void> createOrdine(Ordine ordine) async {
    try {
      isLoading.value = true;
      error.value = '';

      if (!_validateDates(ordine.dataOrdine, ordine.dataConsegna)) {
        throw OrdineError.invalidDates();
      }

      if (ordine.ricambi.isEmpty) {
        throw OrdineError.emptyRicambi();
      }

      await _ordiniService.createOrdine(ordine);
      Get.snackbar('Successo', 'Ordine creato correttamente');
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Aggiorna un ordine esistente
  Future<void> updateOrdine(Ordine ordine) async {
    try {
      isLoading.value = true;
      error.value = '';

      if (!_validateDates(ordine.dataOrdine, ordine.dataConsegna)) {
        throw OrdineError.invalidDates();
      }

      if (ordine.ricambi.isEmpty) {
        throw OrdineError.emptyRicambi();
      }

      await _ordiniService.updateOrdine(ordine);
      Get.snackbar('Successo', 'Ordine aggiornato correttamente');
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Aggiorna lo stato di un ordine
  Future<void> updateStatoOrdine(String id, StatoOrdine nuovoStato) async {
    try {
      isLoading.value = true;
      error.value = '';

      final ordine = ordini.firstWhere(
        (o) => o.id == id,
        orElse: () => throw OrdineError.notFound(id),
      );

      final updatedOrdine = ordine.copyWith(stato: nuovoStato);
      await _ordiniService.updateOrdine(updatedOrdine);
      Get.snackbar('Successo', 'Stato ordine aggiornato correttamente');
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Valida le date dell'ordine
  bool _validateDates(DateTime dataOrdine, DateTime? dataConsegna) {
    if (dataConsegna == null) return true;
    return dataConsegna.isAfter(dataOrdine);
  }

  /// Seleziona un ordine corrente
  void selectOrdine(Ordine? ordine) => selectedOrdine.value = ordine;
}

/// Classe per la gestione degli errori specifici degli ordini
class OrdineError {
  static String notFound(String id) => 'Ordine con ID $id non trovato';
  static String invalidDates() =>
      'La data di consegna deve essere successiva alla data dell\'ordine';
  static String emptyRicambi() => 'L\'ordine deve contenere almeno un ricambio';
  static String loadError(String message) =>
      'Errore nel caricamento degli ordini: $message';
  static String invalidOperation(String message) => message;
}
