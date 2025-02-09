import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../models/riparazione.dart';
import '../utils/form_validators.dart';

class FormNuovaRichiesta extends StatefulWidget {
  final List<Cliente> clienti;
  final Function(Riparazione) onSubmit;

  const FormNuovaRichiesta({
    Key? key,
    required this.clienti,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<FormNuovaRichiesta> createState() => _FormNuovaRichiestaState();
}

class _FormNuovaRichiestaState extends State<FormNuovaRichiesta> {
  final _formKey = GlobalKey<FormState>();
  Cliente? _selectedCliente;
  final _descrizioneController = TextEditingController();
  final _noteController = TextEditingController();
  final _prioritaController = TextEditingController();

  @override
  void dispose() {
    _descrizioneController.dispose();
    _noteController.dispose();
    _prioritaController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _selectedCliente != null) {
      final riparazione = Riparazione(
        id: '',
        cliente: _selectedCliente!,
        descrizione: _descrizioneController.text,
        note: _noteController.text,
        priorita: int.parse(_prioritaController.text),
        stato: StatoRiparazione.nuovaRichiesta,
        dataIngresso: DateTime.now(),
        ricambi: [],
      );

      widget.onSubmit(riparazione);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<Cliente>(
            value: _selectedCliente,
            decoration: const InputDecoration(labelText: 'Cliente'),
            items: widget.clienti.map((cliente) {
              return DropdownMenuItem(
                value: cliente,
                child: Text(cliente.nomeCompleto),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedCliente = value;
              });
            },
            validator: (value) {
              if (value == null) {
                return 'Seleziona un cliente';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descrizioneController,
            decoration:
                const InputDecoration(labelText: 'Descrizione problema'),
            maxLines: 3,
            validator: FormValidators.required,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(labelText: 'Note aggiuntive'),
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _prioritaController,
            decoration: const InputDecoration(
              labelText: 'Priorità',
              helperText: 'Da 1 (bassa) a 5 (alta)',
            ),
            keyboardType: TextInputType.number,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Inserisci la priorità';
              }
              final priorita = int.tryParse(value);
              if (priorita == null || priorita < 1 || priorita > 5) {
                return 'La priorità deve essere un numero da 1 a 5';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submitForm,
            child: const Text('Crea Richiesta'),
          ),
        ],
      ),
    );
  }
}
