import 'package:flutter/material.dart';
import '../models/fornitore.dart';
import '../services/fornitori_service.dart';
import '../widgets/fornitore_form.dart';
import '../widgets/ordine_ricambi_form.dart';

class GestioneFornitori extends StatefulWidget {
  const GestioneFornitori({super.key});

  @override
  State<GestioneFornitori> createState() => _GestioneFornitioriState();
}

class _GestioneFornitioriState extends State<GestioneFornitori> {
  final FornitoriService _fornitoriService = FornitoriService();

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
    return StreamBuilder<List<Fornitore>>(
      stream: _fornitoriService.getFornitori(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final fornitori = snapshot.data!;
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
      },
    );
  }

  Widget _buildOrdiniList() {
    return StreamBuilder<List<OrdineRicambi>>(
      stream: _fornitoriService.getOrdiniRecenti(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final ordini = snapshot.data!;
        return ListView.builder(
          itemCount: ordini.length,
          itemBuilder: (context, index) {
            final ordine = ordini[index];
            return Card(
              margin: const EdgeInsets.all(8),
              child: ListTile(
                title: Text('Ordine #${ordine.id}'),
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
      },
    );
  }

  void _showAddFornitoreDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: FornitoreForm(
          onSubmit: (fornitore) async {
            await _fornitoriService.aggiungiFornitore(fornitore);
            if (mounted) Navigator.pop(context);
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
            await _fornitoriService.aggiornaFornitore(fornitoreAggiornato);
            if (mounted) Navigator.pop(context);
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
            await _fornitoriService.creaOrdine(ordine);
            if (mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _showFornitoreDetails(Fornitore fornitore) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FornitoreDetailsScreen(fornitore: fornitore),
      ),
    );
  }

  void _showOrdineDetails(OrdineRicambi ordine) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OrdineDetailsScreen(ordine: ordine),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
