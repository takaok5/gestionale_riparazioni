import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/riparazione.dart';
import '../models/stato_riparazione.dart';
import '../services/firestore_service.dart';
import '../services/cliente_service.dart'; // Aggiunto
import '../models/cliente.dart'; // Aggiunto
import '../widgets/riparazione_card.dart';
import '../widgets/loading_overlay.dart';

class RiparazioniScreen extends StatefulWidget {
  const RiparazioniScreen({Key? key}) : super(key: key);

  @override
  State<RiparazioniScreen> createState() => _RiparazioniScreenState();
}

class _RiparazioniScreenState extends State<RiparazioniScreen> {
  final TextEditingController _searchController = TextEditingController();
  StatoRiparazione? _selectedStato;
  Map<String, Cliente> _clientiCache = {}; // Cache per i clienti

  @override
  void initState() {
    super.initState();
    _loadClienti();
  }

  Future<void> _loadClienti() async {
    final clienteService = Provider.of<ClienteService>(context, listen: false);
    final clienti = await clienteService.getClienti().first;
    setState(() {
      _clientiCache = {for (var c in clienti) c.id: c};
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = Provider.of<FirestoreService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Riparazioni'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Cerca',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<Riparazione>>(
              stream: firestoreService.getRiparazioni(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(
                    child: Text('Errore: ${snapshot.error}'),
                  );
                }

                if (!snapshot.hasData) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }

                var riparazioni = snapshot.data!;

                // Filtra per stato
                if (_selectedStato != null) {
                  riparazioni = riparazioni
                      .where((r) => r.stato == _selectedStato)
                      .toList();
                }

                // Filtra per ricerca
                if (_searchController.text.isNotEmpty) {
                  final query = _searchController.text.toLowerCase();
                  riparazioni = riparazioni.where((r) {
                    final cliente = _clientiCache[r.clienteId];
                    return (cliente?.nominativo.toLowerCase().contains(query) ??
                            false) ||
                        r.descrizione.toLowerCase().contains(query) ||
                        r.modelloDispositivo.toLowerCase().contains(query) ||
                        r.id.toLowerCase().contains(query);
                  }).toList();
                }

                if (riparazioni.isEmpty) {
                  return const Center(
                    child: Text('Nessuna riparazione trovata'),
                  );
                }

                return ListView.builder(
                  itemCount: riparazioni.length,
                  itemBuilder: (context, index) {
                    final riparazione = riparazioni[index];
                    final cliente = _clientiCache[riparazione.clienteId];
                    return RiparazioneCard(
                      riparazione: riparazione,
                      cliente: cliente,
                      onTap: () => _showDetails(riparazione),
                      onStateChange: (newState) =>
                          _updateState(riparazione, newState),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _showFilterDialog() async {
    final selected = await showDialog<StatoRiparazione>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filtra per stato'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ...StatoRiparazione.values.map(
              (stato) => RadioListTile<StatoRiparazione>(
                title: Text(stato.display),
                value: stato,
                groupValue: _selectedStato,
                onChanged: (value) {
                  Navigator.pop(context, value);
                },
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context, null);
            },
            child: const Text('RESET'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context, _selectedStato);
            },
            child: const Text('ANNULLA'),
          ),
        ],
      ),
    );

    setState(() {
      _selectedStato = selected;
    });
  }

  void _showDetails(Riparazione riparazione) {
    Navigator.pushNamed(
      context,
      '/riparazioni/dettaglio',
      arguments: riparazione,
    );
  }

  Future<void> _updateState(
    Riparazione riparazione,
    StatoRiparazione newState,
  ) async {
    final firestoreService =
        Provider.of<FirestoreService>(context, listen: false);

    try {
      LoadingOverlay.show(context);
      await firestoreService.updateRiparazioneStato(
        riparazione.id,
        newState,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      LoadingOverlay.hide(context);
    }
  }

  void _showAddDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuova Riparazione'),
        content: const Text(
          'Vuoi creare una nuova richiesta di riparazione?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('ANNULLA'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/riparazioni/nuovo');
            },
            child: const Text('PROCEDI'),
          ),
        ],
      ),
    );
  }
}
