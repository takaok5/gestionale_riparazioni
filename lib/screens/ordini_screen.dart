import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import '../controllers/ordini_controller.dart';
import '../widgets/ordine_form.dart';
import '../utils/validators.dart';
import '../models/enums.dart';

class OrdiniScreen extends GetView<OrdiniController> {
  const OrdiniScreen({Key? key}) : super(key: key);

  // Questo metodo statico garantisce che il controller sia inizializzato
  // prima che il widget venga costruito
  static void initDependencies() {
    Get.lazyPut<OrdiniController>(
      () => OrdiniController(),
      fenix: true, // Mantiene il controller in memoria
    );
  }

  @override
  Widget build(BuildContext context) {
    // Non è più necessario inizializzare qui il controller
    // poiché viene fatto attraverso initDependencies
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Gestione Ordini'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Ordini'),
              Tab(text: 'Statistiche'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOrdiniTab(),
            _buildStatisticheTab(),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showNuovoOrdineDialog(context),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  Widget _buildOrdiniTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Cerca',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: controller.setSearchQuery,
                ),
              ),
              const SizedBox(width: 8),
              Obx(() => DropdownButton<StatoOrdine>(
                    value: controller.filtroStato.value,
                    hint: const Text('Stato'),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('Tutti'),
                      ),
                      ...StatoOrdine.values.map(
                        (stato) => DropdownMenuItem(
                          value: stato,
                          child: Text(stato.display),
                        ),
                      ),
                    ],
                    onChanged: controller.setFiltroStato,
                  )),
            ],
          ),
        ),
        Expanded(
          child: Obx(() {
            if (controller.isLoading.value) {
              return const Center(child: CircularProgressIndicator());
            }

            if (controller.error.value.isNotEmpty) {
              return Center(child: Text(controller.error.value));
            }

            return ListView.builder(
              itemCount: controller.ordiniFiltered.length,
              itemBuilder: (context, index) {
                final ordine = controller.ordiniFiltered[index];
                return _buildOrdineCard(context, ordine);
              },
            );
          }),
        ),
      ],
    );
  }

  Widget _buildOrdineCard(BuildContext context, Ordine ordine) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        title: Text('Ordine ${ordine.numeroOrdine}'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Fornitore: ${ordine.fornitore.ragioneSociale}'),
            Text('Stato: ${ordine.stato.display}'),
            Text('Data: ${Validators.formatDate(ordine.dataOrdine)}'),
            Text('Totale: €${ordine.totale.toStringAsFixed(2)}'),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _handleMenuSelection(context, value, ordine),
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'dettagli',
              child: Text('Dettagli'),
            ),
            const PopupMenuItem(
              value: 'modifica',
              child: Text('Modifica Stato'),
            ),
            if (ordine.stato == StatoOrdine.inAttesa)
              const PopupMenuItem(
                value: 'annulla',
                child: Text('Annulla'),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticheTab() {
    return Obx(() {
      if (controller.isLoading.value) {
        return const Center(child: CircularProgressIndicator());
      }

      final stats = controller.statisticheOrdini;
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatCard(
              'Ordini Totali', stats.totaleOrdini.toString(), Colors.blue),
          const SizedBox(height: 16),
          _buildStatCard('Ordini in Attesa', stats.ordiniInAttesa.toString(),
              Colors.orange),
          const SizedBox(height: 16),
          _buildStatCard('Spesa Totale',
              '€${stats.spesaTotale.toStringAsFixed(2)}', Colors.green),
          const SizedBox(height: 16),
          _buildStatCard('Tempo Medio Consegna',
              '${stats.tempoMedioConsegna} giorni', Colors.purple),
        ],
      );
    });
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleMenuSelection(BuildContext context, String value, Ordine ordine) {
    switch (value) {
      case 'dettagli':
        _showDettagliOrdine(context, ordine);
        break;
      case 'modifica':
        _showModificaStatoDialog(context, ordine);
        break;
      case 'annulla':
        _showAnnullaDialog(context, ordine);
        break;
    }
  }

  void _showDettagliOrdine(BuildContext context, Ordine ordine) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Dettagli Ordine ${ordine.numeroOrdine}'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailSection(
                'Informazioni Ordine',
                [
                  _buildDetailRow(
                      'Fornitore:', ordine.fornitore.ragioneSociale),
                  _buildDetailRow('Stato:', ordine.stato.display),
                  _buildDetailRow(
                      'Data:', Validators.formatDate(ordine.dataOrdine)),
                  _buildDetailRow(
                      'Totale:', '€${ordine.totale.toStringAsFixed(2)}'),
                  if (ordine.note.isNotEmpty)
                    _buildDetailRow('Note:', ordine.note),
                ],
              ),
              const SizedBox(height: 16),
              _buildDetailSection(
                'Ricambi Ordinati',
                ordine.ricambi
                    .map((r) => ListTile(
                          title: Text(r.nome),
                          subtitle: Text('Quantità: ${r.quantita}'),
                          trailing: Text('€${r.totale.toStringAsFixed(2)}'),
                        ))
                    .toList(),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Chiudi'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
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

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
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

  void _showModificaStatoDialog(BuildContext context, Ordine ordine) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifica Stato'),
        content: DropdownButtonFormField<StatoOrdine>(
          value: ordine.stato,
          items: StatoOrdine.values
              .map((stato) => DropdownMenuItem(
                    value: stato,
                    child: Text(stato.display),
                  ))
              .toList(),
          onChanged: (newStato) {
            if (newStato != null) {
              Navigator.pop(context);
              controller.updateStatoOrdine(ordine.id, newStato);
            }
          },
        ),
      ),
    );
  }

  void _showAnnullaDialog(BuildContext context, Ordine ordine) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Conferma Annullamento'),
        content: const Text('Sei sicuro di voler annullare questo ordine?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              controller.updateStatoOrdine(ordine.id, StatoOrdine.annullato);
            },
            child: const Text('Sì'),
          ),
        ],
      ),
    );
  }

  void _showNuovoOrdineDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuovo Ordine'),
        content: OrdineForm(
          onSubmit: (ordine) {
            Navigator.pop(context);
            controller.createOrdine(ordine);
          },
        ),
      ),
    );
  }
}
