import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../models/riparazione_archiviata.dart';
import '../services/firestore_service.dart';
import 'package:intl/intl.dart';

class StoricoClienteScreen extends StatelessWidget {
  final String clienteId;
  final Cliente cliente;
  final FirestoreService firestoreService;

  const StoricoClienteScreen({
    Key? key,
    required this.clienteId,
    required this.cliente,
    required this.firestoreService,
  }) : super(key: key);
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Storico ${cliente.nome} ${cliente.cognome}'),
      ),
      body: StreamBuilder<List<RiparazioneArchiviata>>(
        stream: _firestoreService.getRiparazioniArchiviate(cliente.id),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final riparazioni = snapshot.data!;
          final totaleComplessivo = riparazioni.fold<double>(
            0,
            (total, r) => total + r.totalePattuito,
          );

          return Column(
            children: [
              Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Riepilogo Totale',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Riparazioni totali: ${riparazioni.length}',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      Text(
                        'Totale speso: €${totaleComplessivo.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: riparazioni.length,
                  itemBuilder: (context, index) {
                    final riparazione = riparazioni[index];
                    return ExpansionTile(
                      title: Text(riparazione.dispositivo),
                      subtitle: Text(
                        DateFormat('dd/MM/yyyy').format(riparazione.dataUscita),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Problema: ${riparazione.problema}'),
                              Text(
                                  'Ricambi: €${riparazione.costoRicambi.toStringAsFixed(2)}'),
                              Text(
                                  'Manodopera: €${riparazione.costoManodopera.toStringAsFixed(2)}'),
                              Text(
                                  'Totale: €${riparazione.totalePattuito.toStringAsFixed(2)}'),
                              if (riparazione.dettagliRicambi != null) ...[
                                const SizedBox(height: 8),
                                const Text('Dettaglio Ricambi:'),
                                ...riparazione.dettagliRicambi!.entries.map(
                                  (entry) => Text(
                                      '${entry.key}: €${entry.value.toStringAsFixed(2)}'),
                                ),
                              ],
                              if (riparazione.note?.isNotEmpty ?? false) ...[
                                const SizedBox(height: 8),
                                Text('Note: ${riparazione.note}'),
                              ],
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
