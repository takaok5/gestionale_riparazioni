import 'package:flutter/material.dart';

class ModificaQuantitaForm extends StatefulWidget {
  final int quantitaAttuale;
  final Function(int nuovaQuantita, String motivo) onSubmit;

  const ModificaQuantitaForm({
    Key? key,
    required this.quantitaAttuale,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<ModificaQuantitaForm> createState() => _ModificaQuantitaFormState();
}

class _ModificaQuantitaFormState extends State<ModificaQuantitaForm> {
  late TextEditingController _quantitaController;
  late TextEditingController _motivoController;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _quantitaController =
        TextEditingController(text: widget.quantitaAttuale.toString());
    _motivoController = TextEditingController();
  }

  @override
  void dispose() {
    _quantitaController.dispose();
    _motivoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextFormField(
            controller: _quantitaController,
            decoration: const InputDecoration(
              labelText: 'Nuova Quantità',
            ),
            keyboardType: TextInputType.number,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Inserisci una quantità';
              }
              if (int.tryParse(value) == null) {
                return 'Inserisci un numero valido';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _motivoController,
            decoration: const InputDecoration(
              labelText: 'Motivo della modifica',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Inserisci il motivo della modifica';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                final nuovaQuantita = int.parse(_quantitaController.text);
                widget.onSubmit(nuovaQuantita, _motivoController.text);
              }
            },
            child: const Text('Salva'),
          ),
        ],
      ),
    );
  }
}
