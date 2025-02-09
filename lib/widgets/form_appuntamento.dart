import 'package:flutter/material.dart';
import 'package:gestionale_riparazioni/utils/imports.dart';

class FormAppuntamento extends StatefulWidget {
  final String riparazioneId;
  final DateTime? initialDate;
  final Function(DateTime) onSave;

  const FormAppuntamento({
    Key? key,
    required this.riparazioneId,
    this.initialDate,
    required this.onSave,
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

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );
    if (picked != null && picked != _selectedTime) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          title: Text(_selectedDate == null
              ? 'Seleziona data'
              : date_utils.DateUtils.formatDate(_selectedDate!)),
          trailing: const Icon(Icons.calendar_today),
          onTap: () => _selectDate(context),
        ),
        ListTile(
          title: Text(_selectedTime == null
              ? 'Seleziona ora'
              : _selectedTime!.format(context)),
          trailing: const Icon(Icons.access_time),
          onTap: () => _selectTime(context),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _selectedDate != null && _selectedTime != null
              ? () {
                  final dateTime = DateTime(
                    _selectedDate!.year,
                    _selectedDate!.month,
                    _selectedDate!.day,
                    _selectedTime!.hour,
                    _selectedTime!.minute,
                  );
                  widget.onSave(dateTime);
                }
              : null,
          child: const Text('Conferma appuntamento'),
        ),
      ],
    );
  }
}
