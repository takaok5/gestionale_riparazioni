import 'package:flutter/material.dart';
import '../models/garanzia.dart';
import '../services/garanzia_service.dart';
import '../widgets/garanzia_form.dart';

class GaranzieScreen extends StatefulWidget {
  const GaranzieScreen({super.key});

  @override
  State<GaranzieScreen> createState() => _GaranzieScreenState();
}

class _GaranzieScreenState extends State<GaranzieScreen> {
  final GaranziaService _garanziaService = GaranziaService();
  bool _mostraSoloAttive = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestione Garanzie'),
        actions: [
          IconButton(
            icon: Icon(
                _mostraSoloAttive ? Icons.visibility : Icons.visibility_off),
            onPressed: () =>
                setState(() => _mostraSoloAttive = !_mostraSoloAttive),
            tooltip: _mostraSoloAttive ? 'Mostra tutte' : 'Mostra solo attive',
          ),
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
        onPressed: () => _showNuovaGaranziaDialog(),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Cerca garanzia...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          suffixIcon: IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              _searchController.clear();
              setState(() {});
            },
          ),
        ),
        onChanged: (value) => setState(() {}),
      ),
    );
  }

  Widget _buildStatisticheGaranzie() {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: StreamBuilder<Map<String, int>>(
          stream: _garanziaService.getStatisticheGaranzie(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final stats = snapshot.data!;
            return Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard(
                  'Garanzie Attive',
                  stats['attive'].toString(),
                  Colors.green,
                ),
                _buildStatCard(
                  'In Scadenza',
                  stats['inScadenza'].toString(),
                  Colors.orange,
                ),
                _buildStatCard(
                  'Scadute',
                  stats['scadute'].toString(),
                  Colors.red,
                ),
              ],
            );
          },
        ),
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
    return StreamBuilder<List<Garanzia>>(
      stream: _mostraSoloAttive
          ? _garanziaService.getGaranzieAttive()
          : _garanziaService.getAllGaranzie(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        var garanzie = snapshot.data!;

        // Applica il filtro di ricerca
        if (_searchController.text.isNotEmpty) {
          final search = _searchController.text.toLowerCase();
          garanzie = garanzie
              .where((g) =>
                  g.dispositivo.toLowerCase().contains(search) ||
                  g.clienteId.toLowerCase().contains(search))
              .toList();
        }

        if (garanzie.isEmpty) {
          return const Center(
            child: Text('Nessuna garanzia trovata'),
          );
        }

        return ListView.builder(
          itemCount: garanzie.length,
          itemBuilder: (context, index) {
            final garanzia = garanzie[index];
            return _buildGaranziaCard(garanzia);
          },
        );
      },
    );
  }

  Widget _buildGaranziaCard(Garanzia garanzia) {
    final now = DateTime.now();
    final giorniAllaScadenza = garanzia.dataScadenza.difference(now).inDays;

    Color statusColor;
    if (!garanzia.attiva) {
      statusColor = Colors.grey;
    } else if (giorniAllaScadenza <= 0) {
      statusColor = Colors.red;
    } else if (giorniAllaScadenza <= 30) {
      statusColor = Colors.orange;
    } else {
      statusColor = Colors.green;
    }

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
          'Scadenza: ${_formatDate(garanzia.dataScadenza)}\n'
          '${garanzia.attiva ? "Giorni rimanenti: $giorniAllaScadenza" : "GARANZIA NON ATTIVA"}',
        ),
        trailing: garanzia.attiva
            ? IconButton(
                icon: const Icon(Icons.more_vert),
                onPressed: () => _showGaranziaOptions(garanzia),
              )
            : null,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Componenti coperti:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Wrap(
                  spacing: 8,
                  children: garanzia.componentiCoperti
                      .map((c) => Chip(label: Text(c)))
                      .toList(),
                ),
                if (garanzia.note?.isNotEmpty ?? false) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'Note:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(garanzia.note!),
                ],
                ButtonBar(
                  children: [
                    TextButton.icon(
                      icon: const Icon(Icons.print),
                      label: const Text('Stampa'),
                      onPressed: () => _stampaCertificatoGaranzia(garanzia),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.info),
                      label: const Text('Dettagli'),
                      onPressed: () => _showGaranziaDetails(garanzia),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showGaranziaOptions(Garanzia garanzia) {
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
                _showEditNoteDialog(garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.cancel),
              title: const Text('Invalida Garanzia'),
              onTap: () {
                Navigator.pop(context);
                _showInvalidaGaranziaDialog(garanzia);
              },
            ),
            ListTile(
              leading: const Icon(Icons.print),
              title: const Text('Stampa Certificato'),
              onTap: () {
                Navigator.pop(context);
                _stampaCertificatoGaranzia(garanzia);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditNoteDialog(Garanzia garanzia) {
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
            onPressed: () async {
              await _garanziaService.updateNote(
                garanzia.id,
                noteController.text,
              );
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Salva'),
          ),
        ],
      ),
    );
  }

  void _showInvalidaGaranziaDialog(Garanzia garanzia) {
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
            onPressed: () async {
              if (motivazioneController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Inserisci un motivo valido')),
                );
                return;
              }
              await _garanziaService.invalidaGaranzia(
                garanzia.id,
                motivazioneController.text,
              );
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Conferma'),
          ),
        ],
      ),
    );
  }

  void _showNuovaGaranziaDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: GaranziaForm(
          onSubmit: (garanzia) async {
            await _garanziaService.registraGaranzia(
              riparazioneId: garanzia.riparazioneId,
              clienteId: garanzia.clienteId,
              dispositivo: garanzia.dispositivo,
              durataGiorniGaranzia:
                  garanzia.dataScadenza.difference(garanzia.dataInizio).inDays,
              componentiCoperti: garanzia.componentiCoperti,
              note: garanzia.note,
            );
            if (mounted) Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _showGaranziaDetails(Garanzia garanzia) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GaranziaDetailsScreen(garanzia: garanzia),
      ),
    );
  }

  Future<void> _stampaCertificatoGaranzia(Garanzia garanzia) async {
    // TODO: Implementare la generazione e stampa del certificato
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Funzionalità in sviluppo')),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
