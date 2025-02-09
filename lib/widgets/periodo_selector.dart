import 'package:flutter/material.dart';
import '../utils/validators.dart';

class PeriodoSelector extends StatelessWidget {
  final DateTime startDate;
  final DateTime endDate;
  final Function(DateTime, DateTime) onPeriodChanged;

  const PeriodoSelector({
    Key? key,
    required this.startDate,
    required this.endDate,
    required this.onPeriodChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Periodo',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildDateSelector(
                    context,
                    'Data Inizio',
                    startDate,
                    (date) => onPeriodChanged(date, endDate),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDateSelector(
                    context,
                    'Data Fine',
                    endDate,
                    (date) => onPeriodChanged(startDate, date),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildPeriodoPreset('Ultimi 7 giorni', 7),
                _buildPeriodoPreset('Ultimi 30 giorni', 30),
                _buildPeriodoPreset('Ultimi 90 giorni', 90),
                _buildPeriodoPreset('Quest\'anno', 0),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSelector(
    BuildContext context,
    String label,
    DateTime selectedDate,
    Function(DateTime) onChanged,
  ) {
    return InkWell(
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: selectedDate,
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
        );
        if (date != null) {
          onChanged(date);
        }
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        child: Text(Validators.formatDate(selectedDate)),
      ),
    );
  }

  Widget _buildPeriodoPreset(String label, int days) {
    return TextButton(
      onPressed: () {
        final end = DateTime.now();
        final start = days == 0
            ? DateTime(end.year, 1, 1)
            : end.subtract(Duration(days: days));
        onPeriodChanged(start, end);
      },
      child: Text(label),
    );
  }
}
