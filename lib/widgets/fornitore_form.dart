import 'package:flutter/material.dart';
import '../models/fornitore.dart';
import '../utils/validators.dart';

class FornitoreForm extends StatefulWidget {
  final Function(Fornitore) onSubmit;
  final Fornitore? fornitore;

  const FornitoreForm({
    Key? key,
    required this.onSubmit,
    this.fornitore,
  }) : super(key: key);

  @override
  State<FornitoreForm> createState() => _FornitoreFormState();
}

class _FornitoreFormState extends State<FornitoreForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _ragioneSocialeController;
  late TextEditingController _partitaIvaController;
  late TextEditingController _telefonoController;
  late TextEditingController _emailController;
  late TextEditingController _indirizzoController;
  late TextEditingController _noteController;

  @override
  void initState() {
    super.initState();
    final f = widget.fornitore;
    _ragioneSocialeController = TextEditingController(text: f?.ragioneSociale);
    _partitaIvaController = TextEditingController(text: f?.partitaIva);
    _telefonoController = TextEditingController(text: f?.telefono);
    _emailController = TextEditingController(text: f?.email);
    _indirizzoController =
        TextEditingController(text: f?.indirizzo?.toString() ?? '');
    _noteController = TextEditingController(text: f?.note);
  }

  @override
  void dispose() {
    _ragioneSocialeController.dispose();
    _partitaIvaController.dispose();
    _telefonoController.dispose();
    _emailController.dispose();
    _indirizzoController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final fornitore = Fornitore(
        id: widget.fornitore?.id ??
            DateTime.now().millisecondsSinceEpoch.toString(),
        ragioneSociale: _ragioneSocialeController.text,
        partitaIva: _partitaIvaController.text,
        telefono: _telefonoController.text,
        email: _emailController.text,
        indirizzo: _indirizzoController.text,
        note: _noteController.text,
        createdAt: widget.fornitore?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      widget.onSubmit(fornitore);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextFormField(
            controller: _ragioneSocialeController,
            decoration: const InputDecoration(labelText: 'Ragione Sociale *'),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Campo obbligatorio';
              }
              return null;
            },
          ),
          TextFormField(
            controller: _partitaIvaController,
            decoration: const InputDecoration(labelText: 'Partita IVA *'),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Campo obbligatorio';
              }
              if (!Validators.isValidPartitaIva(value)) {
                return 'Partita IVA non valida';
              }
              return null;
            },
          ),
          TextFormField(
            controller: _telefonoController,
            decoration: const InputDecoration(labelText: 'Telefono *'),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Campo obbligatorio';
              }
              if (!Validators.isValidPhoneNumber(value)) {
                return 'Numero di telefono non valido';
              }
              return null;
            },
          ),
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) {
              if (value != null && value.isNotEmpty) {
                if (!Validators.isValidEmail(value)) {
                  return 'Email non valida';
                }
              }
              return null;
            },
          ),
          TextFormField(
            controller: _indirizzoController,
            decoration: const InputDecoration(labelText: 'Indirizzo'),
            maxLines: 2,
          ),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(labelText: 'Note'),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitForm,
            child: Text(widget.fornitore == null ? 'Aggiungi' : 'Salva'),
          ),
        ],
      ),
    );
  }
}
