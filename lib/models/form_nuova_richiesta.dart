import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../models/riparazione.dart';
import '../utils/form_validators.dart';
import '../models/enums/priorita_riparazione.dart';
import '../models/enums/stato_riparazione.dart';
import '../models/enums/tipo_riparazione.dart';

// Rimuovere questa definizione perché è già importata da tipo_riparazione.dart
// enum TipoRiparazione { hardware, software, misto }

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
  String?
      _selectedDispositivoId; // Aggiunto per gestire il dispositivo selezionato
  final _descrizioneController = TextEditingController();
  final _noteController = TextEditingController();
  final _prezzoController = TextEditingController(); // Aggiunto per il prezzo
  final _costoRicambiController =
      TextEditingController(); // Aggiunto per il costo ricambi
  PrioritaRiparazione _priorita =
      PrioritaRiparazione.bassa; // Cambiato da 'normale' a 'bassa'
  TipoRiparazione _tipoRiparazione = TipoRiparazione.standard;

  @override
  void dispose() {
    _descrizioneController.dispose();
    _noteController.dispose();
    _prezzoController.dispose();
    _costoRicambiController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _selectedCliente != null) {
      final dispositivo = _selectedCliente!.dispositivi
          .firstWhere((d) => d.id == _selectedDispositivoId);

      final riparazione = Riparazione(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        clienteId: _selectedCliente!.id,
        dispositivoId: _selectedDispositivoId!,
        tipoDispositivo: dispositivo.tipo,
        modelloDispositivo: dispositivo.modello,
        descrizione: _descrizioneController.text,
        note: _noteController.text,
        priorita: _priorita,
        stato: StatoRiparazione.inAttesa,
        dataIngresso: DateTime.now(),
        ricambi: const [],
        prezzo: double.parse(_prezzoController.text),
        costoRicambi: double.parse(_costoRicambiController.text),
        tipoRiparazione: _tipoRiparazione,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
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
                _selectedDispositivoId =
                    null; // Reset dispositivo quando cambia il cliente
              });
            },
            validator: (value) {
              if (value == null) return 'Seleziona un cliente';
              return null;
            },
          ),
          if (_selectedCliente != null) ...[
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedDispositivoId,
              decoration: const InputDecoration(labelText: 'Dispositivo'),
              items: _selectedCliente!.dispositivi.map((dispositivo) {
                return DropdownMenuItem(
                  value: dispositivo.id,
                  child: Text('${dispositivo.marca} ${dispositivo.modello}'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedDispositivoId = value;
                });
              },
              validator: (value) {
                if (value == null) return 'Seleziona un dispositivo';
                return null;
              },
            ),
          ],
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
            controller: _prezzoController,
            decoration: const InputDecoration(
              labelText: 'Prezzo',
              prefixText: '€ ',
            ),
            keyboardType: TextInputType.number,
            validator: FormValidators.required,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _costoRicambiController,
            decoration: const InputDecoration(
              labelText: 'Costo Ricambi',
              prefixText: '€ ',
            ),
            keyboardType: TextInputType.number,
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
                child: Text(priorita.toString().split('.').last),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _priorita = value ?? PrioritaRiparazione.bassa;
              });
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<TipoRiparazione>(
            value: _tipoRiparazione,
            decoration: const InputDecoration(
              labelText: 'Tipo Riparazione',
            ),
            items: TipoRiparazione.values.map((tipo) {
              return DropdownMenuItem(
                value: tipo,
                child: Text(tipo.toString().split('.').last),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _tipoRiparazione = value ?? TipoRiparazione.standard;
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
