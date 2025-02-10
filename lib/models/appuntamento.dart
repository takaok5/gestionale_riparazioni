import 'package:flutter/material.dart';
import 'package:meta/meta.dart';
import './base_model.dart';
import './indirizzo.dart';
import '../utils/date_formatter.dart';
import 'enums/enums.dart';

@immutable
class Appuntamento extends BaseModel {
  final String clienteId;
  final String? riparazioneId;  // New field to link with repairs
  final DateTime dataOra;
  final String descrizione;
  final StatoAppuntamento stato;
  final Indirizzo? luogoAppuntamento;
  final String? note;
  final String? tecnicoAssegnato;
  final TipoAppuntamento tipo;  // New field to categorize appointments

  const Appuntamento({
    required String id,
    required this.clienteId,
    this.riparazioneId,
    required this.dataOra,
    required this.descrizione,
    this.stato = StatoAppuntamento.programmato,
    this.luogoAppuntamento,
    this.note,
    this.tecnicoAssegnato,
    this.tipo = TipoAppuntamento.generico,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : assert(clienteId != ''),
        assert(descrizione != ''),
        super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory Appuntamento.fromMap(Map<String, dynamic> map) {
    return Appuntamento(
      id: map['id'] as String,
      clienteId: map['clienteId'] as String,
      riparazioneId: map['riparazioneId'] as String?,
      dataOra: DateTime.parse(map['dataOra'] as String),
      descrizione: map['descrizione'] as String,
      stato: StatoAppuntamento.values.firstWhere(
        (e) => e.toString() == 'StatoAppuntamento.${map['stato']}',
        orElse: () => StatoAppuntamento.programmato,
      ),
      tipo: TipoAppuntamento.values.firstWhere(
        (e) => e.toString() == 'TipoAppuntamento.${map['tipo']}',
        orElse: () => TipoAppuntamento.generico,
      ),
      luogoAppuntamento: map['luogoAppuntamento'] != null
          ? Indirizzo.fromMap(map['luogoAppuntamento'] as Map<String, dynamic>)
          : null,
      note: map['note'] as String?,
      tecnicoAssegnato: map['tecnicoAssegnato'] as String?,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'riparazioneId': riparazioneId,
      'dataOra': dataOra.toIso8601String(),
      'descrizione': descrizione,
      'stato': stato.toString().split('.').last,
      'tipo': tipo.toString().split('.').last,
      'luogoAppuntamento': luogoAppuntamento?.toMap(),
      'note': note,
      'tecnicoAssegnato': tecnicoAssegnato,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Appuntamento copyWith({
    String? clienteId,
    String? riparazioneId,
    DateTime? dataOra,
    String? descrizione,
    StatoAppuntamento? stato,
    TipoAppuntamento? tipo,
    Indirizzo? luogoAppuntamento,
    String? note,
    String? tecnicoAssegnato,
  }) {
    return Appuntamento(
      id: id,
      clienteId: clienteId ?? this.clienteId,
      riparazioneId: riparazioneId ?? this.riparazioneId,
      dataOra: dataOra ?? this.dataOra,
      descrizione: descrizione ?? this.descrizione,
      stato: stato ?? this.stato,
      tipo: tipo ?? this.tipo,
      luogoAppuntamento: luogoAppuntamento ?? this.luogoAppuntamento,
      note: note ?? this.note,
      tecnicoAssegnato: tecnicoAssegnato ?? this.tecnicoAssegnato,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

// Form widget for creating/editing appointments
class AppuntamentoForm extends StatefulWidget {
  final String clienteId;
  final String? riparazioneId;
  final Appuntamento? initialAppuntamento;
  final Function(Appuntamento) onSubmit;

  const AppuntamentoForm({
    Key? key,
    required this.clienteId,
    this.riparazioneId,
    this.initialAppuntamento,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<AppuntamentoForm> createState() => _AppuntamentoFormState();
}

class _AppuntamentoFormState extends State<AppuntamentoForm> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  final _descrizioneController = TextEditingController();
  final _noteController = TextEditingController();
  late TipoAppuntamento _tipo;
  
  @override
  void initState() {
    super.initState();
    if (widget.initialAppuntamento != null) {
      _selectedDate = widget.initialAppuntamento!.dataOra;
      _selectedTime = TimeOfDay.fromDateTime(widget.initialAppuntamento!.dataOra);
      _descrizioneController.text = widget.initialAppuntamento!.descrizione;
      _noteController.text = widget.initialAppuntamento!.note ?? '';
      _tipo = widget.initialAppuntamento!.tipo;
    } else {
      _tipo = widget.riparazioneId != null 
          ? TipoAppuntamento.riparazione 
          : TipoAppuntamento.generico;
    }
  }

  @override
  void dispose() {
    _descrizioneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Data selection
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: Text(_selectedDate == null
                ? 'Seleziona data'
                : DateFormatter.formatDate(_selectedDate!)),
            onTap: () => _selectDate(context),
          ),
          // Time selection
          ListTile(
            leading: const Icon(Icons.access_time),
            title: Text(_selectedTime == null
                ? 'Seleziona ora'
                : _selectedTime!.format(context)),
            onTap: () => _selectTime(context),
          ),
          // Description field
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextFormField(
              controller: _descrizioneController,
              decoration: const InputDecoration(
                labelText: 'Descrizione',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Inserisci una descrizione';
                }
                return null;
              },
            ),
          ),
          // Notes field
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextFormField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: 'Note aggiuntive',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ),
          // Appointment type selection
          if (widget.riparazioneId == null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: DropdownButtonFormField<TipoAppuntamento>(
                value: _tipo,
                decoration: const InputDecoration(
                  labelText: 'Tipo appuntamento',
                  border: OutlineInputBorder(),
                ),
                items: TipoAppuntamento.values.map((tipo) {
                  return DropdownMenuItem(
                    value: tipo,
                    child: Text(tipo.toString().split('.').last),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _tipo = value ?? TipoAppuntamento.generico;
                  });
                },
              ),
            ),
          const SizedBox(height: 24),
          // Action buttons
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
                child: Text(widget.initialAppuntamento != null
                    ? 'Aggiorna'
                    : 'Crea Appuntamento'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  bool get _canSubmit =>
      _selectedDate != null &&
      _selectedTime != null &&
      _descrizioneController.text.isNotEmpty;

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
    if (_formKey.currentState!.validate() && _selectedDate != null && _selectedTime != null) {
      final dateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );

      final appuntamento = Appuntamento(
        id: widget.initialAppuntamento?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        clienteId: widget.clienteId,
        riparazioneId: widget.riparazioneId,
        dataOra: dateTime,
        descrizione: _descrizioneController.text,
        note: _noteController.text.isNotEmpty ? _noteController.text : null,
        tipo: _tipo,
        createdAt: widget.initialAppuntamento?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      widget.onSubmit(appuntamento);
    }
  }
}

// Enum for appointment types
enum TipoAppuntamento {
  generico,
  riparazione,
  consulenza,
  sopralluogo,
  consegna,
}