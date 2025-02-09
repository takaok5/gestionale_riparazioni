import 'package:flutter/material.dart';
import '../models/garanzia.dart';
import '../utils/validators.dart';

class GaranziaForm extends StatefulWidget {
  final Garanzia? garanzia;
  final Function(Garanzia) onSubmit;

  const GaranziaForm({
    Key? key,
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
  final _prodottoController = TextEditingController();
  final _serialeController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _dataInizio = widget.garanzia?.dataInizio ?? DateTime.now();
    _dataFine = widget.garanzia?.dataFine ??
        DateTime.now().add(const Duration(days: 365));
    if (widget.garanzia != null) {
      _prodottoController.text = widget.garanzia!.prodotto;
      _serialeController.text = widget.garanzia!.seriale ?? '';
      _noteController.text = widget.garanzia!.note ?? '';
    }
  }

  @override
  void dispose() {
    _prodottoController.dispose();
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
            _dataFine = _dataInizio.add(const Duration(days: 1));
          }
        } else {
          _dataFine = picked;
        }
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final garanzia = Garanzia(
        id: widget.garanzia?.id ?? '',
        prodotto: _prodottoController.text,
        dataInizio: _dataInizio,
        dataFine: _dataFine,
        seriale:
            _serialeController.text.isEmpty ? null : _serialeController.text,
        note: _noteController.text.isEmpty ? null : _noteController.text,
        stato: widget.garanzia?.stato ?? StatoGaranzia.attiva,
        createdAt: widget.garanzia?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      widget.onSubmit(garanzia);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextFormField(
            controller: _prodottoController,
            decoration: const InputDecoration(labelText: 'Prodotto *'),
            validator: (value) => Validators.required(value, 'Prodotto'),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ListTile(
                  title: const Text('Data Inizio'),
                  subtitle: Text(Validators.formatDate(_dataInizio)),
                  onTap: () => _selectDate(context, true),
                ),
              ),
              Expanded(
                child: ListTile(
                  title: const Text('Data Fine'),
                  subtitle: Text(Validators.formatDate(_dataFine)),
                  onTap: () => _selectDate(context, false),
                ),
              ),
            ],
          ),
          TextFormField(
            controller: _serialeController,
            decoration: const InputDecoration(labelText: 'Numero Seriale'),
          ),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(labelText: 'Note'),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submit,
            child: Text(widget.garanzia == null ? 'Aggiungi' : 'Salva'),
          ),
        ],
      ),
    );
  }
}
