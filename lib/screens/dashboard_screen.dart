import 'package:flutter/material.dart';
import '../services/firestore_service.dart';

class DashboardScreen extends StatelessWidget {
  final FirestoreService _firestoreService = FirestoreService();

  DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _firestoreService.getStatistiche(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Errore: ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final stats = snapshot.data!;

          return GridView.count(
            crossAxisCount: 3,
            padding: const EdgeInsets.all(16.0),
            children: [
              _StatCard(
                title: 'Clienti Totali',
                value: stats['totaleClienti'].toString(),
                icon: Icons.people,
                color: Colors.blue,
              ),
              _StatCard(
                title: 'Dispositivi Gestiti',
                value: stats['totaleDispositivi'].toString(),
                icon: Icons.devices,
                color: Colors.green,
              ),
              _StatCard(
                title: 'Riparazioni in Corso',
                value: stats['riparazioniInCorso'].toString(),
                icon: Icons.build,
                color: Colors.orange,
              ),
              _StatCard(
                title: 'Riparazioni Completate',
                value: stats['riparazioniCompletate'].toString(),
                icon: Icons.check_circle,
                color: Colors.teal,
              ),
              _StatCard(
                title: 'Fatturato Totale',
                value: '€${stats['fatturatoTotale'].toStringAsFixed(2)}',
                icon: Icons.euro,
                color: Colors.purple,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
