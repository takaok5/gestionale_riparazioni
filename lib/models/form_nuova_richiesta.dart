import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../models/riparazione.dart';
import '../utils/form_validators.dart';
import '../models/enums/priorita_riparazione.dart';
import '../models/enums/stato_riparazione.dart';

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
  PrioritaRiparazione _priorita = PrioritaRiparazione.normale;

  @override
  void dispose() {
    _descrizioneController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _selectedCliente != null) {
      final riparazione = Riparazione(
        clienteId: _selectedCliente!.id,
        tipoDispositivo: _selectedCliente!.dispositivi.first.tipo,
        modelloDispositivo: _selectedCliente!.dispositivi.first.modello,
        descrizione: _descrizioneController.text,
        note: _noteController.text,
        priorita: _priorita,
        stato: StatoRiparazione.nuovaRichiesta,
        dataIngresso: DateTime.now(),
        ricambi: const [],
        prezzo: 0,
        costoRicambi: 0,
        tipoRiparazione: TipoRiparazione.standard,
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
                child: Text('${cliente.nome} ${cliente.cognome}'),
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
            decoration: const InputDecoration(labelText: 'Descrizione problema'),
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
          DropdownButtonFormField<PrioritaRiparazione>(
            value: _priorita,
            decoration: const InputDecoration(
              labelText: 'Priorità',
              helperText: 'Seleziona la priorità della riparazione',
            ),
            items: PrioritaRiparazione.values.map((priorita) {
              return DropdownMenuItem(
                value: priorita,
                child: Text(priorita.toString()),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _priorita = value ?? PrioritaRiparazione.normale;
              });
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