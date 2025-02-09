import 'package:flutter/material.dart';
import '../models/cliente.dart';
import '../utils/validators.dart';

class ClienteForm extends StatefulWidget {
  final Cliente? cliente;
  final Function(Cliente) onSubmit;

  const ClienteForm({
    Key? key,
    this.cliente,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<ClienteForm> createState() => _ClienteFormState();
}

class _ClienteFormState extends State<ClienteForm> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _cognomeController = TextEditingController();
  final _emailController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _indirizzoController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.cliente != null) {
      _nomeController.text = widget.cliente!.nome;
      _cognomeController.text = widget.cliente!.cognome;
      _emailController.text = widget.cliente!.email;
      _telefonoController.text = widget.cliente!.telefono;
      _indirizzoController.text = widget.cliente!.indirizzo ?? '';
      _noteController.text = widget.cliente!.note ?? '';
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _cognomeController.dispose();
    _emailController.dispose();
    _telefonoController.dispose();
    _indirizzoController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final cliente = Cliente(
        id: widget.cliente?.id ?? '',
        nome: _nomeController.text,
        cognome: _cognomeController.text,
        email: _emailController.text,
        telefono: _telefonoController.text,
        indirizzo: _indirizzoController.text,
        note: _noteController.text,
        createdAt: widget.cliente?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      widget.onSubmit(cliente);
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
            controller: _nomeController,
            decoration: const InputDecoration(labelText: 'Nome *'),
            validator: (value) => Validators.required(value, 'Nome'),
          ),
          TextFormField(
            controller: _cognomeController,
            decoration: const InputDecoration(labelText: 'Cognome *'),
            validator: (value) => Validators.required(value, 'Cognome'),
          ),
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(labelText: 'Email *'),
            validator: (value) => Validators.email(value),
          ),
          TextFormField(
            controller: _telefonoController,
            decoration: const InputDecoration(labelText: 'Telefono *'),
            validator: (value) => Validators.phone(value),
          ),
          TextFormField(
            controller: _indirizzoController,
            decoration: const InputDecoration(labelText: 'Indirizzo'),
          ),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(labelText: 'Note'),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submit,
            child: Text(widget.cliente == null ? 'Aggiungi' : 'Salva'),
          ),
        ],
      ),
    );
  }
}
