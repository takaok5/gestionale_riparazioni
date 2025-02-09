import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../services/contabilita_service.dart';
import '../widgets/periodo_selector.dart';
import '../widgets/report_summary_card.dart';
import '../utils/validators.dart';
import '../utils/date_formatter.dart';

class ReportContabilitaScreen extends StatefulWidget {
  const ReportContabilitaScreen({Key? key}) : super(key: key);

  @override
  State<ReportContabilitaScreen> createState() =>
      _ReportContabilitaScreenState();
}

class _ReportContabilitaScreenState extends State<ReportContabilitaScreen> {
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final contabilitaService = Provider.of<ContabilitaService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Contabilità'),
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range),
            onPressed: _selectDateRange,
          ),
        ],
      ),
      body: StreamBuilder<Map<String, dynamic>>(
        stream: contabilitaService.getReportContabilita(_startDate, _endDate),
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

          final data = snapshot.data!;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDateRangeInfo(),
                const SizedBox(height: 24),
                _buildStatCard(
                  'Totale Incassi',
                  '€ ${data['totaleIncassi'].toStringAsFixed(2)}',
                  Colors.green,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  'Totale Costi',
                  '€ ${data['totaleCosti'].toStringAsFixed(2)}',
                  Colors.red,
                ),
                const SizedBox(height: 16),
                _buildStatCard(
                  'Margine',
                  '€ ${data['margine'].toStringAsFixed(2)}',
                  data['margine'] >= 0 ? Colors.blue : Colors.orange,
                ),
                const SizedBox(height: 24),
                _buildStatRow(
                  'Riparazioni Completate',
                  data['riparazioniCompletate'].toString(),
                ),
                const SizedBox(height: 8),
                _buildStatRow(
                  'Riparazioni in Corso',
                  data['riparazioniInCorso'].toString(),
                ),
                const SizedBox(height: 8),
                _buildStatRow(
                  'Margine Medio per Riparazione',
                  '€ ${data['margineMedio'].toStringAsFixed(2)}',
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 16),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateRangeInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Periodo',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${DateFormatter.formatDate(_startDate)} - ${DateFormatter.formatDate(_endDate)}',
                style: TextStyle(
                  color: Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDateRange(),
            tooltip: 'Seleziona periodo',
          ),
        ],
      ),
    );
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(
        start: _startDate,
        end: _endDate,
      ),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }
}
