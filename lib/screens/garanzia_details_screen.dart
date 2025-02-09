import 'package:flutter/material.dart';
import '../models/garanzia.dart';

class GaranziaDetailsScreen extends StatelessWidget {
  final Garanzia garanzia;

  const GaranziaDetailsScreen({
    super.key,
    required this.garanzia,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dettagli Garanzia'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard(),
            const SizedBox(height: 16),
            _buildComponentiCoperti(),
            if (garanzia.note?.isNotEmpty ?? false) ...[
              const SizedBox(height: 16),
              _buildNote(),
            ],
            const SizedBox(height: 16),
            _buildStato(),
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
              garanzia.dispositivo,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _buildInfoRow('Data Inizio:', _formatDate(garanzia.dataInizio)),
            _buildInfoRow('Data Scadenza:', _formatDate(garanzia.dataScadenza)),
            _buildInfoRow(
              'Durata:',
              '${garanzia.dataScadenza.difference(garanzia.dataInizio).inDays} giorni',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComponentiCoperti() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Componenti Coperti',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: garanzia.componentiCoperti
                  .map((c) => Chip(label: Text(c)))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNote() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Note',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(garanzia.note!),
          ],
        ),
      ),
    );
  }

  Widget _buildStato() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Stato Garanzia',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  garanzia.attiva ? Icons.check_circle : Icons.cancel,
                  color: garanzia.attiva ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 8),
                Text(
                  garanzia.attiva ? 'Attiva' : 'Non Attiva',
                  style: TextStyle(
                    color: garanzia.attiva ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            if (!garanzia.attiva &&
                garanzia.motivazioneInvalidazione != null) ...[
              const SizedBox(height: 8),
              Text('Motivo: ${garanzia.motivazioneInvalidazione}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 8),
          Text(value),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
