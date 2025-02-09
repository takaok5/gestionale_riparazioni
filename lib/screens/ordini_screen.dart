import 'package:flutter/material.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import '../services/ordini_service.dart';
import '../widgets/ordine_form.dart';
import '../utils/validators.dart';

class OrdiniScreen extends StatefulWidget {
  const OrdiniScreen({Key? key}) : super(key: key);

  @override
  State<OrdiniScreen> createState() => _OrdiniScreenState();
}

class _OrdiniScreenState extends State<OrdiniScreen> {
  final OrdiniService _ordiniService = OrdiniService();
  final TextEditingController _searchController = TextEditingController();
  StatoOrdine? _selectedStato;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                  controller: _searchController,
                  decoration: const InputDecoration(
                    labelText: 'Cerca',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) => setState(() {}),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<StatoOrdine>(
                value: _selectedStato,
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
                onChanged: (value) => setState(() => _selectedStato = value),
              ),
            ],
          ),
        ),
        Expanded(
          child: StreamBuilder<List<Ordine>>(
            stream: _ordiniService.getOrdini(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              var ordini = snapshot.data!;

              // Applica i filtri
              if (_searchController.text.isNotEmpty) {
                ordini = ordini
                    .where((o) =>
                        o.numeroOrdine
                            .toLowerCase()
                            .contains(_searchController.text.toLowerCase()) ||
                        o.fornitore.ragioneSociale
                            .toLowerCase()
                            .contains(_searchController.text.toLowerCase()))
                    .toList();
              }

              if (_selectedStato != null) {
                ordini =
                    ordini.where((o) => o.stato == _selectedStato).toList();
              }

              return ListView.builder(
                itemCount: ordini.length,
                itemBuilder: (context, index) {
                  final ordine = ordini[index];
                  return Card(
                    margin:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: ListTile(
                      title: Text('Ordine ${ordine.numeroOrdine}'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Fornitore: ${ordine.fornitore.ragioneSociale}'),
                          Text('Stato: ${ordine.stato.display}'),
                          Text(
                            'Data: ${Validators.formatDate(ordine.dataOrdine)}',
                          ),
                          Text(
                            'Totale: €${ordine.totale.toStringAsFixed(2)}',
                          ),
                        ],
                      ),
                      trailing: PopupMenuButton<String>(
                        onSelected: (value) =>
                            _handleMenuSelection(value, ordine),
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
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatisticheTab() {
    return StreamBuilder<Map<String, dynamic>>(
      stream: _ordiniService.getStatisticheOrdini(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final stats = snapshot.data!;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildStatCard(
              'Ordini Totali',
              stats['totaleOrdini'].toString(),
              Colors.blue,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Ordini in Attesa',
              stats['ordiniInAttesa'].toString(),
              Colors.orange,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Spesa Totale',
              '€${stats['spesaTotale'].toStringAsFixed(2)}',
              Colors.green,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Tempo Medio Consegna',
              '${stats['tempoMedioConsegna']} giorni',
              Colors.purple,
            ),
          ],
        );
      },
    );
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

  void _showNuovoOrdineDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuovo Ordine'),
        content: OrdineForm(
          onSubmit: (ordine) async {
            Navigator.pop(context);
            await _ordiniService.addOrdine(ordine);
          },
        ),
      ),
    );
  }

  void _handleMenuSelection(String value, Ordine ordine) {
    switch (value) {
      case 'dettagli':
        _showDettagliOrdine(ordine);
        break;
      case 'modifica':
        _showModificaStatoDialog(ordine);
        break;
      case 'annulla':
        _annullaOrdine(ordine);
        break;
    }
  }

  void _showModificaStatoDialog(Ordine ordine) {
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
          onChanged: (newStato) async {
            if (newStato != null) {
              Navigator.pop(context);
              await _ordiniService.updateStatoOrdine(
                ordine.id,
                newStato,
              );
            }
          },
        ),
      ),
    );
  }

  Future<void> _annullaOrdine(Ordine ordine) async {
    final conferma = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Conferma Annullamento'),
        content: const Text('Sei sicuro di voler annullare questo ordine?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sì'),
          ),
        ],
      ),
    );

    if (conferma == true) {
      await _ordiniService.updateStatoOrdine(
        ordine.id,
        StatoOrdine.annullato,
      );
    }
  }
}
