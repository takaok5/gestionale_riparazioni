import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/garanzie_controller.dart';
import '../models/garanzia.dart';
import '../widgets/garanzia_form.dart';

class GaranzieScreen extends GetView<GaranzieController> {
  const GaranzieScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Inizializza il controller
    Get.put(GaranzieController());

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
              _buildStatCard('Garanzie Attive', stats.attive.toString(), Colors.green),
              _buildStatCard('In Scadenza', stats.inScadenza.toString(), Colors.orange),
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
        return const Center(
          child: Text('Nessuna garanzia trovata'),
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
    final giorniAllaScadenza = controller.getGiorniAllaScadenza(garanzia);

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
          'Scadenza: ${controller.formatDate(garanzia.dataScadenza)}\n'
          '${garanzia.attiva ? "Giorni rimanenti: $giorniAllaScadenza" : "GARANZIA NON ATTIVA"}',
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

  Widget _buildGaranziaDetails(BuildContext context, Garanzia garanzia) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoSection('Informazioni Generali', [
            _buildInfoRow('Data Inizio:', controller.formatDate(garanzia.dataInizio)),
            _buildInfoRow('Data Scadenza:', controller.formatDate(garanzia.dataScadenza)),
            _buildInfoRow(
              'Durata:',
              '${garanzia.dataScadenza.difference(garanzia.dataInizio).inDays} giorni',
            ),
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
            children: [
              TextButton.icon(
                icon: const Icon(Icons.print),
                label: const Text('Stampa'),
                onPressed: () => controller.stampaCertificatoGaranzia(garanzia),
              ),
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

  Widget _buildComponentiCoperti(Garanzia garanzia) {
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
              .map((c) => Chip(label: Text(c)))
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
              color: garanzia.attiva ? Colors.green : Colors.red,
            ),
            const SizedBox(width: 8),
            Text(
              garanzia.attiva ? 'Attiva' : 'Non Attiva',
              style: TextStyle(
                color: garanzia.attiva ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        if (!garanzia.attiva && garanzia.motivazioneInvalidazione != null) ...[
          const SizedBox(height: 8),
          Text('Motivo: ${garanzia.motivazioneInvalidazione}'),
        ],
      ],
    );
  }

  void _showGaranziaOptions(BuildContext context, Garanzia garanzia) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Modifica Note'),
              onTap: () {
                Navigator.pop(context);
                _showEditNoteDialog(context, garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.cancel),
              title: const Text('Invalida Garanzia'),
              onTap: () {
                Navigator.pop(context);
                _showInvalidaGaranziaDialog(context, garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.print),
              title: const Text('Stampa Certificato'),
              onTap: () {
                Navigator.pop(context);
                controller.stampaCertificatoGaranzia(garanzia);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditNoteDialog(BuildContext context, Garanzia garanzia) {
    final TextEditingController noteController =
        TextEditingController(text: garanzia.note);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
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
            onPressed: () => Navigator.pop(context),
            child: const Text('Annulla'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              controller.updateNote(garanzia.id, noteController.text);
            },
            child: const Text('Salva'),
          ),
        ],
      ),
    );
  }

  void _showInvalidaGaranziaDialog(BuildContext context, Garanzia garanzia) {
    final TextEditingController motivazioneController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Invalida Garanzia'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Inserisci il motivo dell\'invalidazione:'),
            const SizedBox(height: 8),
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
            onPressed: () => Navigator.pop(context),
            child: const Text('Annulla'),
          ),
          TextButton(
            onPressed: () {
              if (motivazioneController.text.trim().isEmpty) {
                Get.snackbar(
                  'Errore',
                  'Inserisci un motivo valido',
                  snackPosition: SnackPosition.BOTTOM,
                );
                return;
              }
              Navigator.pop(context);
              controller.invalidaGaranzia(
                garanzia.id,
                motivazioneController.text,
              );
            },
            child: const Text('Conferma'),
          ),
        ],
      ),
    );
  }

  void _showNuovaGaranziaDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: GaranziaForm(
          onSubmit: (garanzia) {
            Navigator.pop(context);
            controller.registraGaranzia(garanzia);
          },
        ),
      ),
    );
  }
}