import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../services/firestore_service.dart';
import '../widgets/cliente_form.dart';
import '../utils/validators.dart';

class ClientiScreen extends StatefulWidget {
  const ClientiScreen({Key? key}) : super(key: key);

  @override
  State<ClientiScreen> createState() => _ClientiScreenState();
}

class _ClientiScreenState extends State<ClientiScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  final TextEditingController _searchController = TextEditingController();

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
          title: const Text('Gestione Clienti'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Lista Clienti'),
              Tab(text: 'Statistiche'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildClientiTab(),
            _buildStatisticheTab(),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showNuovoClienteDialog(context),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  Widget _buildClientiTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              labelText: 'Cerca Cliente',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => setState(() {}),
          ),
        ),
        Expanded(
          child: StreamBuilder<List<Cliente>>(
            stream: _firestoreService.getClienti(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              var clienti = snapshot.data!;

              // Filtra per ricerca
              if (_searchController.text.isNotEmpty) {
                clienti = clienti
                    .where((c) =>
                        c.nominativo
                            .toLowerCase()
                            .contains(_searchController.text.toLowerCase()) ||
                        c.email
                            .toLowerCase()
                            .contains(_searchController.text.toLowerCase()) ||
                        c.telefono.contains(_searchController.text))
                    .toList();
              }

              if (clienti.isEmpty) {
                return const Center(
                  child: Text('Nessun cliente trovato'),
                );
              }

              return ListView.builder(
                itemCount: clienti.length,
                itemBuilder: (context, index) {
                  final cliente = clienti[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text(
                          cliente.nominativo.substring(0, 1).toUpperCase(),
                        ),
                      ),
                      title: Text(cliente.nominativo),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Email: ${cliente.email}'),
                          Text('Tel: ${cliente.telefono}'),
                        ],
                      ),
                      trailing: PopupMenuButton<String>(
                        onSelected: (value) =>
                            _handleMenuSelection(value, cliente),
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'dettagli',
                            child: Text('Dettagli'),
                          ),
                          const PopupMenuItem(
                            value: 'modifica',
                            child: Text('Modifica'),
                          ),
                          const PopupMenuItem(
                            value: 'riparazioni',
                            child: Text('Storico Riparazioni'),
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
      stream: _firestoreService.getStatisticheClienti(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final stats = snapshot.data!;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildStatCard(
              'Totale Clienti',
              stats['totaleClienti'].toString(),
              Colors.blue,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Clienti Attivi',
              stats['clientiAttivi'].toString(),
              Colors.green,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Media Riparazioni per Cliente',
              stats['mediaRiparazioni'].toStringAsFixed(1),
              Colors.orange,
            ),
            const SizedBox(height: 16),
            _buildStatCard(
              'Fatturato Medio per Cliente',
              '€${stats['fatturatoMedio'].toStringAsFixed(2)}',
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

  void _showNuovoClienteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nuovo Cliente'),
        content: ClienteForm(
          onSubmit: (cliente) async {
            Navigator.pop(context);
            await _firestoreService.addCliente(cliente);
          },
        ),
      ),
    );
  }

  void _handleMenuSelection(String value, Cliente cliente) {
    switch (value) {
      case 'dettagli':
        _showDettagliCliente(cliente);
        break;
      case 'modifica':
        _showModificaClienteDialog(cliente);
        break;
      case 'riparazioni':
        _showStoricoRiparazioni(cliente);
        break;
    }
  }

  void _showDettagliCliente(Cliente cliente) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(cliente.nominativo),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Email: ${cliente.email}'),
            Text('Telefono: ${cliente.telefono}'),
            if (cliente.indirizzo != null)
              Text('Indirizzo: ${cliente.indirizzo}'),
            if (cliente.note != null) Text('Note: ${cliente.note}'),
            const SizedBox(height: 16),
            Text(
              'Cliente dal: ${Validators.formatDate(cliente.createdAt)}',
              style: const TextStyle(fontStyle: FontStyle.italic),
            ),
          ],
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

  void _showModificaClienteDialog(Cliente cliente) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifica Cliente'),
        content: ClienteForm(
          cliente: cliente,
          onSubmit: (clienteAggiornato) async {
            Navigator.pop(context);
            await _firestoreService.updateCliente(clienteAggiornato);
          },
        ),
      ),
    );
  }

  void _showStoricoRiparazioni(Cliente cliente) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StoricoRiparazioniScreen(cliente: cliente),
      ),
    );
  }
}
