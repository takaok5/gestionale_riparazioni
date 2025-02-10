import 'package:flutter/material.dart';
import '../models/garanzia.dart';
import '../utils/validators.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import '../enums/enums.dart';

class GaranziaForm extends StatefulWidget {
  final GaranziaInterna? garanzia;
  final Function(GaranziaInterna) onSubmit;
  final String clienteId;
  final List<String> componentiCoperti;
  final String dispositivo;
  final String riparazioneId;

  const GaranziaForm({
    Key? key,
    required this.clienteId,
    required this.componentiCoperti,
    required this.dispositivo,
    required this.riparazioneId,
    this.garanzia,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<GaranziaForm> createState() => _GaranziaFormState();
}

class _GaranziaFormState extends State<GaranziaForm> {
  final _formKey = GlobalKey<FormState>();
  late DateTime _dataInizio;
  late DateTime _dataFine;
  final _serialeController = TextEditingController();
  final _noteController = TextEditingController();
  List<String> _componentiSelezionati = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  void _initializeForm() {
    _dataInizio =
        widget.garanzia?.dataInizio ?? AppDateUtils.getCurrentDateTime();
    _dataFine = widget.garanzia?.dataFine ??
        AppDateUtils.addDays(AppDateUtils.getCurrentDateTime(), 365);

    if (widget.garanzia != null) {
      _serialeController.text = widget.garanzia!.seriale ?? '';
      _noteController.text = widget.garanzia!.note ?? '';
      _componentiSelezionati = List.from(widget.garanzia!.componentiCoperti);
    } else {
      _componentiSelezionati = List.from(widget.componentiCoperti);
    }
  }

  @override
  void dispose() {
    _serialeController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isDataInizio) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isDataInizio ? _dataInizio : _dataFine,
      firstDate: isDataInizio ? DateTime(2000) : _dataInizio,
      lastDate: DateTime(2100),
      locale: const Locale('it', 'IT'),
    );
    if (picked != null) {
      setState(() {
        if (isDataInizio) {
          _dataInizio = picked;
          // Aggiusta la data fine se necessario
          if (_dataFine.isBefore(_dataInizio)) {
            _dataFine = AppDateUtils.addDays(_dataInizio, 365);
          }
        } else {
          _dataFine = picked;
        }
      });
    }
  }

  bool _validateForm() {
    if (!_formKey.currentState!.validate()) {
      return false;
    }

    if (_componentiSelezionati.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Seleziona almeno un componente coperto da garanzia'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    if (_dataInizio.isAfter(_dataFine)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
              'La data di inizio non può essere successiva alla data di fine'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    return true;
  }

  Future<void> _submit() async {
    if (_isLoading) return;

    if (!_validateForm()) return;

    setState(() => _isLoading = true);

    try {
      final now = AppDateUtils.getCurrentDateTime();
      final garanzia = GaranziaInterna(
        id: widget.garanzia?.id ?? '',
        numero: widget.garanzia?.numero ?? _generateNumeroGaranzia(),
        riparazioneId: widget.riparazioneId,
        clienteId: widget.clienteId,
        dispositivo: widget.dispositivo,
        dataInizio: _dataInizio,
        dataFine: _dataFine,
        seriale: _serialeController.text.trim().isEmpty
            ? null
            : _serialeController.text.trim(),
        note: _noteController.text.trim().isEmpty
            ? null
            : _noteController.text.trim(),
        stato: widget.garanzia?.stato ?? StatoGaranzia.attiva,
        componentiCoperti: _componentiSelezionati,
        createdAt: widget.garanzia?.createdAt ?? now,
        updatedAt: now,
      );

      garanzia.validate(); // Valida il modello prima di inviarlo
      widget.onSubmit(garanzia);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  String _generateNumeroGaranzia() {
    final now = AppDateUtils.getCurrentDateTime();
    final timestamp = now.millisecondsSinceEpoch.toString();
    return 'GAR${now.year}${timestamp.substring(timestamp.length - 6)}';
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 16),
            _buildDateSection(),
            const SizedBox(height: 16),
            _buildDurationInfo(),
            const SizedBox(height: 16),
            _buildSerialField(),
            const SizedBox(height: 16),
            _buildComponentiSection(),
            const SizedBox(height: 16),
            _buildNoteField(),
            const SizedBox(height: 24),
            _buildSubmitButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dispositivo: ${widget.dispositivo}',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('ID Riparazione: ${widget.riparazioneId}'),
            Text('ID Cliente: ${widget.clienteId}'),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSection() {
    return Row(
      children: [
        Expanded(
          child: ListTile(
            title: const Text('Data Inizio'),
            subtitle: Text(AppDateUtils.formatDate(_dataInizio)),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _selectDate(context, true),
          ),
        ),
        Expanded(
          child: ListTile(
            title: const Text('Data Fine'),
            subtitle: Text(AppDateUtils.formatDate(_dataFine)),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _selectDate(context, false),
          ),
        ),
      ],
    );
  }

  Widget _buildDurationInfo() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            const Icon(Icons.timer),
            const SizedBox(width: 8),
            Text(
                'Durata: ${AppDateUtils.formatDuration(_dataFine.difference(_dataInizio))}',
                style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }

  Widget _buildSerialField() {
    return TextFormField(
      controller: _serialeController,
      decoration: const InputDecoration(
        labelText: 'Numero Seriale',
        helperText: 'Opzionale',
        prefixIcon: Icon(Icons.qr_code),
        border: OutlineInputBorder(),
      ),
      textInputAction: TextInputAction.next,
    );
  }

  Widget _buildComponentiSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Componenti coperti:',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: widget.componentiCoperti.map((componente) {
            final isSelected = _componentiSelezionati.contains(componente);
            return FilterChip(
              label: Text(componente),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _componentiSelezionati.add(componente);
                  } else {
                    _componentiSelezionati.remove(componente);
                  }
                });
              },
              selectedColor: Theme.of(context).colorScheme.primaryContainer,
              checkmarkColor: Theme.of(context).colorScheme.primary,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildNoteField() {
    return TextFormField(
      controller: _noteController,
      decoration: const InputDecoration(
        labelText: 'Note',
        helperText: 'Opzionale',
        prefixIcon: Icon(Icons.note),
        border: OutlineInputBorder(),
      ),
      maxLines: 3,
      textInputAction: TextInputAction.done,
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submit,
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(widget.garanzia == null
                ? 'Crea Garanzia'
                : 'Aggiorna Garanzia'),
      ),
    );
  }
}
