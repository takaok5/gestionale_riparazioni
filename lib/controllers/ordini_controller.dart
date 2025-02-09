import 'package:get/get.dart';
import '../models/ordine.dart'; // Cambiato da ordine_ricambi.dart
import '../services/ordini_service.dart';
import '../models/enums.dart';
import 'dart:async';

class OrdiniController extends GetxController {
  final OrdiniService _ordiniService = OrdiniService();

  // Cambiato il tipo da OrdineRicambi a Ordine
  final RxList<Ordine> ordini = <Ordine>[].obs;
  final Rx<Ordine?> selectedOrdine = Rx<Ordine?>(null);
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  StreamSubscription<List<Ordine>>? _ordiniSubscription;

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

  void loadOrdini() {
    isLoading.value = true;
    error.value = '';

    try {
      _ordiniSubscription = _ordiniService.getOrdini().listen(
        (ordiniList) {
          ordini.value = ordiniList;
          isLoading.value = false;
        },
        onError: (e) {
          error.value = 'Errore nel caricamento degli ordini: $e';
          isLoading.value = false;
        },
      );
    } catch (e) {
      error.value = 'Errore nel caricamento degli ordini: $e';
      isLoading.value = false;
    }
  }

  Future<void> createOrdine(Ordine ordine) async {
    try {
      isLoading.value = true;
      error.value = '';

      await _ordiniService
          .addOrdine(ordine); // Cambiato da createOrdine a addOrdine
      Get.snackbar('Successo', 'Ordine creato correttamente');
    } catch (e) {
      error.value = 'Errore nella creazione dell\'ordine: $e';
      Get.snackbar('Errore', 'Impossibile creare l\'ordine');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateOrdine(Ordine ordine) async {
    try {
      isLoading.value = true;
      error.value = '';

      await _ordiniService.updateOrdine(ordine);
      Get.snackbar('Successo', 'Ordine aggiornato correttamente');
    } catch (e) {
      error.value = 'Errore nell\'aggiornamento dell\'ordine: $e';
      Get.snackbar('Errore', 'Impossibile aggiornare l\'ordine');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateStatoOrdine(String id, StatoOrdine nuovoStato) async {
    try {
      isLoading.value = true;
      error.value = '';

      await _ordiniService.updateStatoOrdine(id, nuovoStato);
      Get.snackbar('Successo', 'Stato ordine aggiornato correttamente');
    } catch (e) {
      error.value = 'Errore nell\'aggiornamento dello stato: $e';
      Get.snackbar('Errore', 'Impossibile aggiornare lo stato dell\'ordine');
    } finally {
      isLoading.value = false;
    }
  }

  void selectOrdine(Ordine? ordine) {
    selectedOrdine.value = ordine;
  }
}
