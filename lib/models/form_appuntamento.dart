import 'package:flutter/material.dart';
import '../utils/date_formatter.dart';
import 'enums/enums.dart';

class FormAppuntamento extends StatefulWidget {
  final String riparazioneId;
  final DateTime? initialDate;
  final Function(DateTime) onSubmit;

  const FormAppuntamento({
    Key? key,
    required this.riparazioneId,
    this.initialDate,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<FormAppuntamento> createState() => _FormAppuntamentoState();
}

class _FormAppuntamentoState extends State<FormAppuntamento> {
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  @override
  void initState() {
    super.initState();
    if (widget.initialDate != null) {
      _selectedDate = widget.initialDate;
      _selectedTime = TimeOfDay.fromDateTime(widget.initialDate!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          leading: const Icon(Icons.calendar_today),
          title: Text(_selectedDate == null
              ? 'Seleziona data'
              : DateFormatter.formatDate(_selectedDate!)),
          onTap: () => _selectDate(context),
        ),
        ListTile(
          leading: const Icon(Icons.access_time),
          title: Text(_selectedTime == null
              ? 'Seleziona ora'
              : _selectedTime!.format(context)),
          onTap: () => _selectTime(context),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annulla'),
            ),
            const SizedBox(width: 16),
            ElevatedButton(
              onPressed: _canSubmit ? _submit : null,
              child: const Text('Conferma'),
            ),
          ],
        ),
      ],
    );
  }

  bool get _canSubmit => _selectedDate != null && _selectedTime != null;

  Future<void> _selectDate(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _selectedDate = date);
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );
    if (time != null) {
      setState(() => _selectedTime = time);
    }
  }

  void _submit() {
    if (_selectedDate != null && _selectedTime != null) {
      final dateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
      widget.onSubmit(dateTime);
    }
  }
}
