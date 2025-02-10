import 'package:get/get.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // Aggiungi questo import
import '../models/ordine.dart';
import '../services/ordini_service.dart';
import '..enums/enums.dart';
import 'dart:async';

/// Controller per la gestione degli ordini
class OrdiniController extends GetxController {
  final OrdiniService _ordiniService =
      OrdiniService(FirebaseFirestore.instance);

  final RxList<Ordine> ordini = <Ordine>[].obs;
  final Rx<Ordine?> selectedOrdine = Rx<Ordine?>(null);
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  StreamSubscription<List<Ordine>>? _ordiniSubscription;

  /// Mappa delle transizioni di stato valide
  final Map<StatoOrdine, List<StatoOrdine>> validTransitions = {
    StatoOrdine.inCreazione: [StatoOrdine.inAttesa],
    StatoOrdine.inAttesa: [StatoOrdine.confermato, StatoOrdine.annullato],
    StatoOrdine.confermato: [StatoOrdine.consegnato, StatoOrdine.annullato],
    StatoOrdine.consegnato: [],
    StatoOrdine.annullato: [],
  };

  @override
  void onInit() {
    super.onInit();
    loadOrdini();
  }

  @override
  void onClose() {
    _ordiniSubscription?.cancel();
    super.onClose();
  }

  /// Carica la lista degli ordini
  void loadOrdini() {
    isLoading.value = true;
    error.value = '';

    try {
      _ordiniSubscription = _ordiniService.getOrdiniStream().listen(
        // Corretto il nome del metodo
        (ordiniList) {
          ordini.value = ordiniList;
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

      await _ordiniService.createOrdine(ordine); // Corretto il nome del metodo
      Get.snackbar('Successo', 'Ordine creato correttamente');
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

      await _ordiniService.addOrdine(ordine);
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

      if (!validTransitions[ordine.stato]!.contains(nuovoStato)) {
        throw OrdineError.invalidState(ordine.stato, nuovoStato);
      }

      await _ordiniService.updateStatoOrdine(id, nuovoStato);
      Get.snackbar('Successo', 'Stato ordine aggiornato correttamente');
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Aggiunge un ricambio a un ordine esistente
  Future<void> addRicambioToOrdine(
      String ordineId, RicambioOrdine ricambio) async {
    try {
      isLoading.value = true;
      error.value = '';

      final ordine = ordini.firstWhere(
        (o) => o.id == ordineId,
        orElse: () => throw OrdineError.notFound(ordineId),
      );

      if (ordine.stato != StatoOrdine.inCreazione) {
        throw OrdineError.invalidOperation(
          'Non è possibile aggiungere ricambi a un ordine non in creazione',
        );
      }

      final updatedOrdine = ordine.copyWith(
        ricambi: [...ordine.ricambi, ricambio],
      );

      await updateOrdine(updatedOrdine);
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Rimuove un ricambio da un ordine esistente
  Future<void> removeRicambioFromOrdine(
      String ordineId, String ricambioId) async {
    try {
      isLoading.value = true;
      error.value = '';

      final ordine = ordini.firstWhere(
        (o) => o.id == ordineId,
        orElse: () => throw OrdineError.notFound(ordineId),
      );

      if (ordine.stato != StatoOrdine.inCreazione) {
        throw OrdineError.invalidOperation(
          'Non è possibile rimuovere ricambi da un ordine non in creazione',
        );
      }

      final updatedRicambi =
          ordine.ricambi.where((r) => r.id != ricambioId).toList();

      if (updatedRicambi.length == ordine.ricambi.length) {
        throw OrdineError.ricambioNotFound(ricambioId);
      }

      final updatedOrdine = ordine.copyWith(ricambi: updatedRicambi);
      await updateOrdine(updatedOrdine);
    } catch (e) {
      error.value = e.toString();
      Get.snackbar('Errore', error.value);
    } finally {
      isLoading.value = false;
    }
  }

  /// Seleziona un ordine corrente
  void selectOrdine(Ordine? ordine) {
    selectedOrdine.value = ordine;
  }
}

/// Classe per la gestione degli errori specifici degli ordini
class OrdineError {
  static String notFound(String id) => 'Ordine con ID $id non trovato';

  static String invalidState(StatoOrdine from, StatoOrdine to) =>
      'Transizione di stato non valida da ${from.label} a ${to.label}';

  static String invalidDates() =>
      'La data di consegna deve essere successiva alla data dell\'ordine';

  static String emptyRicambi() => 'L\'ordine deve contenere almeno un ricambio';

  static String ricambioNotFound(String id) =>
      'Ricambio con ID $id non trovato nell\'ordine';

  static String loadError(String message) =>
      'Errore nel caricamento degli ordini: $message';

  static String invalidOperation(String message) => message;
}
