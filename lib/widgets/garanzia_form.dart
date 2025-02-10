import 'package:flutter/material.dart';
import '../models/garanzia.dart';
import '../utils/validators.dart';
import '../utils/date_utils.dart' show AppDateUtils;

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

  @override
  void initState() {
    super.initState();
    _dataInizio = widget.garanzia?.dataInizio ?? AppDateUtils.getCurrentDateTime();
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
    );
    if (picked != null) {
      setState(() {
        if (isDataInizio) {
          _dataInizio = picked;
          if (_dataFine.isBefore(_dataInizio)) {
            _dataFine = AppDateUtils.addDays(_dataInizio, 1);
          }
        } else {
          _dataFine = picked;
        }
      });
    }
  }

  bool _validateForm() {
    if (_componentiSelezionati.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seleziona almeno un componente coperto da garanzia')),
      );
      return false;
    }
    return _formKey.currentState!.validate();
  }

  void _submit() {
    if (_validateForm()) {
      final now = AppDateUtils.getCurrentDateTime();
      final garanzia = GaranziaInterna(
        id: widget.garanzia?.id ?? '',
        numero: widget.garanzia?.numero ?? _generateNumeroGaranzia(),
        riparazioneId: widget.riparazioneId,
        clienteId: widget.clienteId,
        dispositivo: widget.dispositivo,
        dataInizio: _dataInizio,
        dataFine: _dataFine,
        seriale: _serialeController.text.isEmpty ? null : _serialeController.text,
        note: _noteController.text.isEmpty ? null : _noteController.text,
        stato: widget.garanzia?.stato ?? StatoGaranzia.attiva,
        componentiCoperti: _componentiSelezionati,
        createdAt: widget.garanzia?.createdAt ?? now,
        updatedAt: now,
      );

      widget.onSubmit(garanzia);
    }
  }

  String _generateNumeroGaranzia() {
    final now = AppDateUtils.getCurrentDateTime();
    return 'GAR${now.year}${now.millisecondsSinceEpoch.toString().substring(8)}';
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info Cliente e Dispositivo
          Card(
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
          ),
          const SizedBox(height: 16),

          // Date
          Row(
            children: [
              Expanded(
                child: ListTile(
                  title: const Text('Data Inizio'),
                  subtitle: Text(AppDateUtils.formatDate(_dataInizio)),
                  onTap: () => _selectDate(context, true),
                ),
              ),
              Expanded(
                child: ListTile(
                  title: const Text('Data Fine'),
                  subtitle: Text(AppDateUtils.formatDate(_dataFine)),
                  onTap: () => _selectDate(context, false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Durata calcolata
          Text('Durata: ${AppDateUtils.formatDuration(_dataFine.difference(_dataInizio))}',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 16),

          // Seriale
          TextFormField(
            controller: _serialeController,
            decoration: const InputDecoration(
              labelText: 'Numero Seriale',
              helperText: 'Opzionale',
            ),
          ),
          const SizedBox(height: 16),

          // Componenti coperti
          Text('Componenti coperti:', 
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
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
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Note
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(
              labelText: 'Note',
              helperText: 'Opzionale',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 24),

          // Submit Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submit,
              child: Text(widget.garanzia == null ? 'Crea Garanzia' : 'Aggiorna Garanzia'),
            ),
          ),
        ],
      ),
    );
  }
}