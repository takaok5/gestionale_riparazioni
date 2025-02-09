import 'package:flutter/material.dart';
import '../services/statistics_service.dart';

class DashboardStats extends StatelessWidget {
  final StatisticsService statisticsService;

  const DashboardStats({
    Key? key,
    required this.statisticsService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: statisticsService.getDashboardStats(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const Center(
            child: Text('Errore nel caricamento delle statistiche'),
          );
        }

        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final stats = snapshot.data!;

        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          children: [
            _buildStatCard(
              context,
              'Riparazioni Mensili',
              stats['riparazioniMensili'].toString(),
              Icons.build,
              Colors.blue,
            ),
            _buildStatCard(
              context,
              'Guadagno Mensile',
              '€${stats['guadagnoMensile'].toStringAsFixed(2)}',
              Icons.euro,
              Colors.green,
            ),
            _buildStatCard(
              context,
              'Clienti Attivi',
              stats['clientiAttivi'].toString(),
              Icons.people,
              Colors.orange,
            ),
            _buildStatCard(
              context,
              'Ricambi Sotto Scorta',
              stats['ricambiSottoScorta'].toString(),
              Icons.warning,
              Colors.red,
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
