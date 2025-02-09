import 'package:get/get.dart';
import '../models/ordine_ricambi.dart';
import '../services/ordini_service.dart';

class OrdiniController extends GetxController {
  final OrdiniService _ordiniService = OrdiniService();

  final RxList<OrdineRicambi> ordini = <OrdineRicambi>[].obs;
  final Rx<OrdineRicambi?> selectedOrdine = Rx<OrdineRicambi?>(null);
  final RxBool isLoading = false.obs;
  final RxString error = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadOrdini();
  }

  void loadOrdini() {
    isLoading.value = true;
    error.value = '';

    try {
      _ordiniService.getOrdini().listen(
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

  Future<void> createOrdine(OrdineRicambi ordine) async {
    try {
      isLoading.value = true;
      error.value = '';

      await _ordiniService.createOrdine(ordine);
      Get.snackbar('Successo', 'Ordine creato correttamente');
    } catch (e) {
      error.value = 'Errore nella creazione dell\'ordine: $e';
      Get.snackbar('Errore', 'Impossibile creare l\'ordine');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> updateOrdine(OrdineRicambi ordine) async {
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

  Future<void> deleteOrdine(String id) async {
    try {
      isLoading.value = true;
      error.value = '';

      await _ordiniService.deleteOrdine(id);
      Get.snackbar('Successo', 'Ordine eliminato correttamente');
    } catch (e) {
      error.value = 'Errore nell\'eliminazione dell\'ordine: $e';
      Get.snackbar('Errore', 'Impossibile eliminare l\'ordine');
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

  void selectOrdine(OrdineRicambi? ordine) {
    selectedOrdine.value = ordine;
  }
}
