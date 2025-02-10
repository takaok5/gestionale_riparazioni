import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/fornitore.dart';
import '../services/fornitori_service.dart';
import '../widgets/fornitore_form.dart';
import '../widgets/ordine_ricambi_form.dart';
import '../controllers/ordini_controller.dart';

class GestioneFornitori extends GetView<OrdiniController> {
  const GestioneFornitori({super.key});

  // Metodo statico per l'inizializzazione delle dipendenze
  static void initDependencies() {
    Get.lazyPut<OrdiniController>(
      () => OrdiniController(),
      fenix: true, // Mantiene il controller in memoria
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Gestione Fornitori'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Fornitori'),
              Tab(text: 'Ordini'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () => _showAddFornitoreDialog(context),
            ),
          ],
        ),
        body: TabBarView(
          children: [
            _buildFornitoriList(),
            _buildOrdiniList(),
          ],
        ),
      ),
    );
  }

  Widget _buildFornitoriList() {
    return Obx(() {
      if (controller.isLoading.value) {
        return const Center(child: CircularProgressIndicator());
      }

      final fornitori = controller.fornitori;

      if (fornitori.isEmpty) {
        return const Center(child: Text('Nessun fornitore trovato'));
      }

      return ListView.builder(
        itemCount: fornitori.length,
        itemBuilder: (context, index) {
          final fornitore = fornitori[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text(fornitore.nome),
              subtitle: Text(fornitore.email ?? ''),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_cart),
                    onPressed: () => _showNuovoOrdineDialog(fornitore),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => _showEditFornitoreDialog(fornitore),
                  ),
                ],
              ),
              onTap: () => _showFornitoreDetails(fornitore),
            ),
          );
        },
      );
    });
  }

  Widget _buildOrdiniList() {
    return Obx(() {
      if (controller.isLoading.value) {
        return const Center(child: CircularProgressIndicator());
      }

      final ordini = controller.ordiniFiltered;

      if (ordini.isEmpty) {
        return const Center(child: Text('Nessun ordine trovato'));
      }

      return ListView.builder(
        itemCount: ordini.length,
        itemBuilder: (context, index) {
          final ordine = ordini[index];
          return Card(
            margin: const EdgeInsets.all(8),
            child: ListTile(
              title: Text('Ordine #${ordine.numeroOrdine}'),
              subtitle: Text(
                'Data: ${_formatDate(ordine.dataOrdine)}\n'
                'Stato: ${ordine.stato.toString().split('.').last}',
              ),
              trailing: Text(
                '€${ordine.totale.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              onTap: () => _showOrdineDetails(ordine),
            ),
          );
        },
      );
    });
  }

  void _showAddFornitoreDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: FornitoreForm(
          onSubmit: (fornitore) async {
            await controller.aggiungiFornitore(fornitore);
            if (context.mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _showEditFornitoreDialog(Fornitore fornitore) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: FornitoreForm(
          fornitore: fornitore,
          onSubmit: (fornitoreAggiornato) async {
            await controller.aggiornaFornitore(fornitoreAggiornato);
            if (context.mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _showNuovoOrdineDialog(Fornitore fornitore) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: OrdineRicambiForm(
          fornitore: fornitore,
          onSubmit: (ordine) async {
            await controller.createOrdine(ordine);
            if (context.mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _showFornitoreDetails(Fornitore fornitore) {
    Get.to(() => FornitoreDetailsScreen(fornitore: fornitore));
  }

  void _showOrdineDetails(Ordine ordine) {
    Get.to(() => OrdineDetailsScreen(ordine: ordine));
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

// Schermate di dettaglio
class FornitoreDetailsScreen extends GetView<OrdiniController> {
  final Fornitore fornitore;

  const FornitoreDetailsScreen({
    Key? key,
    required this.fornitore,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dettagli ${fornitore.nome}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard(),
            const SizedBox(height: 16),
            _buildOrdiniRecenti(),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Informazioni Fornitore',
              style: Get.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Nome:', fornitore.nome),
            _buildInfoRow('Email:', fornitore.email ?? 'Non specificata'),
            _buildInfoRow('Telefono:', fornitore.telefono ?? 'Non specificato'),
            _buildInfoRow(
                'Indirizzo:', fornitore.indirizzo ?? 'Non specificato'),
            if (fornitore.note?.isNotEmpty ?? false)
              _buildInfoRow('Note:', fornitore.note!),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
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

  Widget _buildOrdiniRecenti() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ordini Recenti',
              style: Get.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Obx(() {
              final ordiniFornitore = controller.ordiniFiltered
                  .where((o) => o.fornitoreId == fornitore.id)
                  .toList();

              if (ordiniFornitore.isEmpty) {
                return const Center(
                  child: Text('Nessun ordine recente'),
                );
              }

              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: ordiniFornitore.length,
                itemBuilder: (context, index) {
                  final ordine = ordiniFornitore[index];
                  return ListTile(
                    title: Text('Ordine #${ordine.numeroOrdine}'),
                    subtitle: Text(
                      'Data: ${_formatDate(ordine.dataOrdine)}\n'
                      'Stato: ${ordine.stato.toString().split('.').last}',
                    ),
                    trailing: Text(
                      '€${ordine.totale.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onTap: () =>
                        Get.to(() => OrdineDetailsScreen(ordine: ordine)),
                  );
                },
              );
            }),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class OrdineDetailsScreen extends GetView<OrdiniController> {
  final Ordine ordine;

  const OrdineDetailsScreen({
    Key? key,
    required this.ordine,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Ordine #${ordine.numeroOrdine}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildOrdineInfo(),
            const SizedBox(height: 16),
            _buildRicambiList(),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdineInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Informazioni Ordine',
              style: Get.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            _buildInfoRow('Numero:', ordine.numeroOrdine),
            _buildInfoRow('Data:', _formatDate(ordine.dataOrdine)),
            _buildInfoRow('Stato:', ordine.stato.toString().split('.').last),
            _buildInfoRow('Fornitore:', ordine.fornitore.nome),
            _buildInfoRow('Totale:', '€${ordine.totale.toStringAsFixed(2)}'),
            if (ordine.note?.isNotEmpty ?? false)
              _buildInfoRow('Note:', ordine.note!),
          ],
        ),
      ),
    );
  }

  Widget _buildRicambiList() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Ricambi Ordinati',
              style: Get.textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: ordine.ricambi.length,
              itemBuilder: (context, index) {
                final ricambio = ordine.ricambi[index];
                return ListTile(
                  title: Text(ricambio.nome),
                  subtitle: Text('Quantità: ${ricambio.quantita}'),
                  trailing: Text(
                    '€${ricambio.totale.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
