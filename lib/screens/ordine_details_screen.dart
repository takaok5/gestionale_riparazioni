import 'package:flutter/material.dart';
import '../models/ordine.dart';
// Rimuovere gli import non utilizzati di ordini_service.dart e status_badge.dart
import '../utils/validators.dart';

class OrdineDetailsScreen extends StatelessWidget {
  final Ordine ordine;

  const OrdineDetailsScreen({
    Key? key,
    required this.ordine,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Ordine ${ordine.numeroOrdine}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            _buildInfoCard(),
            SizedBox(height: 16),
            _buildProdottiList(),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Informazioni Ordine',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildInfoRow('Fornitore:', ordine.fornitore.ragioneSociale),
            _buildInfoRow('Stato:', ordine.stato.display),
            _buildInfoRow('Data:', Validators.formatDate(ordine.dataOrdine)),
            _buildInfoRow('Totale:', '€${ordine.totale.toStringAsFixed(2)}'),
            if (ordine.note.isNotEmpty) // Rimosso il check null non necessario
              _buildInfoRow('Note:', ordine.note),
          ],
        ),
      ),
    );
  }

  Widget _buildProdottiList() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Prodotti Ordinati',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: ordine.ricambi.length, // Cambiato da prodotti a ricambi
              itemBuilder: (context, index) {
                final ricambio = ordine.ricambi[index];
                return ListTile(
                  title: Text(ricambio.nome),
                  subtitle: Text('Quantità: ${ricambio.quantita}'),
                  trailing: Text(
                    '€${ricambio.totale.toStringAsFixed(2)}',
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
}