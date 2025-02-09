import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/ricambio.dart';
import '../models/categoria.dart';
import '../services/inventory_service.dart';
import '../widgets/ricambio_form.dart';
import '../widgets/ricambio_card.dart';
import '../widgets/loading_overlay.dart';

class GestioneMagazzinoScreen extends StatefulWidget {
  const GestioneMagazzinoScreen({Key? key}) : super(key: key);

  @override
  State<GestioneMagazzinoScreen> createState() =>
      _GestioneMagazzinoScreenState();
}

class _GestioneMagazzinoScreenState extends State<GestioneMagazzinoScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final inventoryService = Provider.of<InventoryService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestione Magazzino'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Tutti i Ricambi'),
            Tab(text: 'Sotto Scorta'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Cerca ricambio',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildRicambiList(inventoryService.getRicambi()),
                _buildRicambiList(
                  Stream.fromFuture(inventoryService.getRicambiSottoScorta()),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAggiungiRicambioDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildRicambiList(Stream<List<Ricambio>> ricambiStream) {
    return StreamBuilder<List<Ricambio>>(
      stream: ricambiStream,
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

        var ricambi = snapshot.data!;

        // Filtra per ricerca
        if (_searchController.text.isNotEmpty) {
          final query = _searchController.text.toLowerCase();
          ricambi = ricambi.where((r) {
            return r.nome.toLowerCase().contains(query) ||
                r.codice.toLowerCase().contains(query) ||
                r.categoria.nome.toLowerCase().contains(query);
          }).toList();
        }

        if (ricambi.isEmpty) {
          return const Center(
            child: Text('Nessun ricambio trovato'),
          );
        }

        return ListView.builder(
          itemCount: ricambi.length,
          itemBuilder: (context, index) {
            final ricambio = ricambi[index];
            return RicambioCard(
              ricambio: ricambio,
              onTap: () => _showRicambioDetails(ricambio),
              onEdit: () => _showModificaRicambioDialog(context, ricambio),
            );
          },
        );
      },
    );
  }

  void _showRicambioDetails(Ricambio ricambio) {
    Navigator.pushNamed(
      context,
      '/magazzino/ricambio',
      arguments: ricambio,
    );
  }

  Future<void> _showAggiungiRicambioDialog(BuildContext context) async {
    final inventoryService =
        Provider.of<InventoryService>(context, listen: false);

    final categorie = await inventoryService.getCategorie().first;

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuovo Ricambio'),
        content: SingleChildScrollView(
          child: RicambioForm(
            categorie: categorie,
            onSubmit: (ricambio) async {
              try {
                await inventoryService.addRicambio(ricambio);
                if (!mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ricambio aggiunto con successo'),
                  ),
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Errore: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
        ),
      ),
    );
  }

  Future<void> _showModificaRicambioDialog(
    BuildContext context,
    Ricambio ricambio,
  ) async {
    final inventoryService =
        Provider.of<InventoryService>(context, listen: false);

    final categorie = await inventoryService.getCategorie().first;

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifica Ricambio'),
        content: SingleChildScrollView(
          child: RicambioForm(
            ricambio: ricambio,
            categorie: categorie,
            onSubmit: (ricambioAggiornato) async {
              try {
                await inventoryService.updateRicambio(ricambioAggiornato);
                if (!mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ricambio aggiornato con successo'),
                  ),
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Errore: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
        ),
      ),
    );
  }
}
