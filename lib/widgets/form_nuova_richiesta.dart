import 'package:flutter/material.dart';
import '../models/riparazione.dart';
import '../models/tipo_riparazione.dart';
import '../utils/validators.dart';
import '../models/stato_riparazione.dart';

class FormNuovaRichiesta extends StatefulWidget {
  final Function(Riparazione) onSubmit;

  const FormNuovaRichiesta({
    Key? key,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<FormNuovaRichiesta> createState() => _FormNuovaRichiestaState();
}

class _FormNuovaRichiestaState extends State<FormNuovaRichiesta> {
  final _formKey = GlobalKey<FormState>();
  final _descrizioneController = TextEditingController();
  final _modelloDispositivoController = TextEditingController();
  TipoRiparazione _tipoRiparazione = TipoRiparazione.standard;
  bool _isUrgente = false;

  @override
  void dispose() {
    _descrizioneController.dispose();
    _modelloDispositivoController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final riparazione = Riparazione(
        id: '',
        clienteId: clienteId,
        tipo: tipo,
        modelloDispositivo: modelloController.text,
        descrizione: descrizioneController.text,
        stato: StatoRiparazione.inAttesa,
        prezzo: 0.0, // Valore iniziale, da aggiornare
        costoRicambi: 0.0, // Valore iniziale, da aggiornare
        dataIngresso: DateTime.now(),
      );

      widget.onSubmit(riparazione);
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
            controller: _modelloDispositivoController,
            decoration: const InputDecoration(
              labelText: 'Modello Dispositivo *',
              hintText: 'es. iPhone 12 Pro',
            ),
            validator: (value) => Validators.required(
              value,
              'Modello dispositivo',
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descrizioneController,
            decoration: const InputDecoration(
              labelText: 'Descrizione del problema *',
              hintText: 'Descrivi il problema...',
            ),
            maxLines: 3,
            validator: (value) => Validators.required(
              value,
              'Descrizione',
            ),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<TipoRiparazione>(
            value: _tipoRiparazione,
            decoration: const InputDecoration(
              labelText: 'Tipo di riparazione',
            ),
            items: TipoRiparazione.values.map((tipo) {
              return DropdownMenuItem(
                value: tipo,
                child: Text(tipo.displayName),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => _tipoRiparazione = value);
              }
            },
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Richiesta urgente'),
            subtitle: const Text(
              'Priorità alta nella gestione della riparazione',
            ),
            value: _isUrgente,
            onChanged: (value) => setState(() => _isUrgente = value),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submit,
            child: const Text('Invia richiesta'),
          ),
        ],
      ),
    );
  }
}
