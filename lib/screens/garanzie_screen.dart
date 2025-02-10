import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/garanzie_controller.dart';
import '../models/garanzia.dart';
import '../widgets/garanzia_form.dart';

class GaranzieScreen extends GetView<GaranzieController> {
  const GaranzieScreen({Key? key}) : super(key: key);

  static void initDependencies() {
    Get.lazyPut<GaranzieController>(
      () => GaranzieController(),
      fenix: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestione Garanzie'),
        actions: [
          Obx(() => IconButton(
                icon: Icon(controller.mostraSoloAttive.value
                    ? Icons.visibility
                    : Icons.visibility_off),
                onPressed: controller.toggleMostraSoloAttive,
                tooltip: controller.mostraSoloAttive.value
                    ? 'Mostra tutte'
                    : 'Mostra solo attive',
              )),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildStatisticheGaranzie(),
          Expanded(
            child: _buildListaGaranzie(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showNuovaGaranziaDialog(context),
        child: const Icon(Icons.add),
        tooltip: 'Aggiungi nuova garanzia',
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        onChanged: controller.setSearchQuery,
        decoration: InputDecoration(
          hintText: 'Cerca garanzia...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          suffixIcon: Obx(() => controller.searchQuery.value.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: controller.clearSearch,
                )
              : null),
        ),
      ),
    );
  }

  Widget _buildStatisticheGaranzie() {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Obx(() {
          final stats = controller.statistiche;
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatCard(
                  'Garanzie Attive', stats.attive.toString(), Colors.green),
              _buildStatCard(
                  'In Scadenza', stats.inScadenza.toString(), Colors.orange),
              _buildStatCard('Scadute', stats.scadute.toString(), Colors.red),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildListaGaranzie() {
    return Obx(() {
      if (controller.isLoading.value) {
        return const Center(child: CircularProgressIndicator());
      }

      final garanzie = controller.garanzieFiltered;

      if (garanzie.isEmpty) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.security_off, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                controller.searchQuery.value.isEmpty
                    ? 'Nessuna garanzia presente'
                    : 'Nessuna garanzia trovata',
                style: const TextStyle(fontSize: 16, color: Colors.grey),
              ),
            ],
          ),
        );
      }

      return ListView.builder(
        itemCount: garanzie.length,
        itemBuilder: (context, index) {
          final garanzia = garanzie[index];
          return _buildGaranziaCard(context, garanzia);
        },
      );
    });
  }

  Widget _buildGaranziaCard(BuildContext context, Garanzia garanzia) {
    final statusColor = controller.getStatusColor(garanzia);

    if (garanzia is GaranziaFornitore) {
      return Card(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: ListTile(
          leading: Icon(Icons.business, color: statusColor),
          title: Text('Garanzia Fornitore: ${garanzia.fornitore}'),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('N° ${garanzia.numero}'),
              Text(garanzia.getStatusMessage()),
            ],
          ),
          trailing: garanzia.attiva
              ? IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showGaranziaFornitoreOptions(context, garanzia),
                )
              : null,
        ),
      );
    }

    if (garanzia is GaranziaInterna) {
      return Card(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: ExpansionTile(
          leading: Icon(
            Icons.security,
            color: statusColor,
            size: 32,
          ),
          title: Text(
            garanzia.dispositivo,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(
            'Scadenza: ${garanzia.dataFineFormattata}\n'
            '${garanzia.getStatusMessage()}',
          ),
          trailing: garanzia.attiva
              ? IconButton(
                  icon: const Icon(Icons.more_vert),
                  onPressed: () => _showGaranziaOptions(context, garanzia),
                )
              : null,
          children: [
            _buildGaranziaDetails(context, garanzia),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildGaranziaDetails(BuildContext context, GaranziaInterna garanzia) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoSection('Informazioni Generali', [
            _buildInfoRow('Numero:', garanzia.numero),
            _buildInfoRow('Data Inizio:', garanzia.dataInizioFormattata),
            _buildInfoRow('Data Scadenza:', garanzia.dataFineFormattata),
            _buildInfoRow('Durata:', garanzia.durataFormattata),
            if (garanzia.seriale != null)
              _buildInfoRow('Seriale:', garanzia.seriale!),
          ]),
          const SizedBox(height: 16),
          _buildComponentiCoperti(garanzia),
          if (garanzia.note?.isNotEmpty ?? false) ...[
            const SizedBox(height: 16),
            _buildNote(garanzia),
          ],
          const SizedBox(height: 16),
          _buildStato(garanzia),
          ButtonBar(
            alignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                icon: const Icon(Icons.print),
                label: const Text('Stampa'),
                onPressed: () => controller.stampaCertificatoGaranzia(garanzia),
              ),
              if (garanzia.attiva)
                TextButton.icon(
                  icon: const Icon(Icons.edit),
                  label: const Text('Modifica'),
                  onPressed: () => _showEditNoteDialog(context, garanzia),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Widget _buildComponentiCoperti(GaranziaInterna garanzia) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Componenti Coperti',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: garanzia.componentiCoperti
              .map((c) => Chip(
                    label: Text(c),
                    backgroundColor: Colors.blue.shade100,
                  ))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildNote(Garanzia garanzia) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Note',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(garanzia.note!),
      ],
    );
  }

  Widget _buildStato(Garanzia garanzia) {
    final Color statusColor = garanzia.attiva ? Colors.green : Colors.red;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Stato Garanzia',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(
              garanzia.attiva ? Icons.check_circle : Icons.cancel,
              color: statusColor,
            ),
            const SizedBox(width: 8),
            Text(
              garanzia.getStatusMessage(),
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        if (!garanzia.attiva && 
            garanzia is GaranziaInterna && 
            garanzia.motivazioneInvalidazione != null) ...[
          const SizedBox(height: 8),
          Text('Motivo: ${garanzia.motivazioneInvalidazione}'),
          if (garanzia.dataInvalidazioneFormattata != null)
            Text('Data: ${garanzia.dataInvalidazioneFormattata}'),
        ],
      ],
    );
  }

  void _showGaranziaOptions(BuildContext context, GaranziaInterna garanzia) {
    if (!garanzia.attiva) return;

    Get.bottomSheet(
      SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Modifica Note'),
              onTap: () {
                Get.back();
                _showEditNoteDialog(context, garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.cancel),
              title: const Text('Invalida Garanzia'),
              onTap: () {
                Get.back();
                _showInvalidaGaranziaDialog(context, garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.print),
              title: const Text('Stampa Certificato'),
              onTap: () {
                Get.back();
                controller.stampaCertificatoGaranzia(garanzia);
              },
            ),
          ],
        ),
      ),
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }

  void _showGaranziaFornitoreOptions(BuildContext context, GaranziaFornitore garanzia) {
    if (!garanzia.attiva) return;

    Get.bottomSheet(
      SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Modifica Note'),
              onTap: () {
                Get.back();
                _showEditNoteDialog(context, garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.print),
              title: const Text('Stampa Dettagli'),
              onTap: () {
                Get.back();
                controller.stampaCertificatoGaranzia(garanzia);
              },
            ),
          ],
        ),
      ),
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }

  void _showEditNoteDialog(BuildContext context, Garanzia garanzia) {
    final noteController = TextEditingController(text: garanzia.note);
    Get.dialog(
      AlertDialog(
        title: const Text('Modifica Note'),
        content: TextField(
          controller: noteController,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Inserisci note...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Annulla'),
          ),
          TextButton(
            onPressed: () {
              Get.back();
              controller.updateNote(garanzia.id, noteController.text);
            },
            child: const Text('Salva'),
          ),
        ],
      ),
    );
  }

  void _showInvalidaGaranziaDialog(BuildContext context, GaranziaInterna garanzia) {
    final motivazioneController = TextEditingController();
    Get.dialog(
      AlertDialog(
        title: const Text('Invalida Garanzia'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Questa operazione non può essere annullata. Sei sicuro di voler invalidare la garanzia?',
              style: TextStyle(color: Colors.red),
            ),

const SizedBox(height: 16),
            TextField(
              controller: motivazioneController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Motivo invalidazione...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Annulla'),
          ),
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            onPressed: () {
              if (motivazioneController.text.trim().isEmpty) {
                Get.snackbar(
                  'Errore',
                  'Inserisci un motivo valido',
                  snackPosition: SnackPosition.BOTTOM,
                  backgroundColor: Colors.red.shade100,
                  colorText: Colors.red.shade900,
                );
                return;
              }
              Get.back();
              controller.invalidaGaranzia(
                garanzia.id,
                motivazioneController.text.trim(),
              );
            },
            child: const Text('Invalida'),
          ),
        ],
      ),
    );
  }

  void _showNuovaGaranziaDialog(BuildContext context) {
    Get.dialog(
      Dialog(
        child: GaranziaForm(
          onSubmit: (garanzia) {
            Get.back();
            controller.registraGaranzia(garanzia);
          },
        ),
      ),
    );
  }
}