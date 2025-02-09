import 'package:flutter/material.dart';
import '../models/ricambio.dart';
import '../models/categoria.dart';
import '../utils/form_validators.dart';

class RicambioForm extends StatefulWidget {
  final Ricambio? ricambio;
  final List<Categoria> categorie;
  final Function(Ricambio) onSubmit;

  const RicambioForm({
    Key? key,
    this.ricambio,
    required this.categorie,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<RicambioForm> createState() => _RicambioFormState();
}

class _RicambioFormState extends State<RicambioForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nomeController;
  late TextEditingController _descrizioneController;
  late TextEditingController _codiceController;
  late TextEditingController _quantitaController;
  late TextEditingController _prezzoAcquistoController;
  late TextEditingController _prezzoVenditaController;
  late TextEditingController _scorteMinimeController;
  late Categoria? _selectedCategoria;

  @override
  void initState() {
    super.initState();
    final r = widget.ricambio;
    _nomeController = TextEditingController(text: r?.nome);
    _descrizioneController = TextEditingController(text: r?.descrizione);
    _codiceController = TextEditingController(text: r?.codice);
    _quantitaController = TextEditingController(text: r?.quantita.toString());
    _prezzoAcquistoController = TextEditingController(
      text: r?.prezzoAcquisto.toString(),
    );
    _prezzoVenditaController = TextEditingController(
      text: r?.prezzoVendita.toString(),
    );
    _scorteMinimeController = TextEditingController(
      text: r?.scorteMinime.toString(),
    );
    _selectedCategoria = r?.categoria;
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _descrizioneController.dispose();
    _codiceController.dispose();
    _quantitaController.dispose();
    _prezzoAcquistoController.dispose();
    _prezzoVenditaController.dispose();
    _scorteMinimeController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _selectedCategoria != null) {
      final ricambio = Ricambio(
        id: widget.ricambio?.id ?? '',
        nome: _nomeController.text,
        descrizione: _descrizioneController.text,
        codice: _codiceController.text,
        categoria: _selectedCategoria!,
        quantita: int.parse(_quantitaController.text),
        prezzoAcquisto: double.parse(_prezzoAcquistoController.text),
        prezzoVendita: double.parse(_prezzoVenditaController.text),
        scorteMinime: int.parse(_scorteMinimeController.text),
      );
      widget.onSubmit(ricambio);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _nomeController,
            decoration: const InputDecoration(labelText: 'Nome'),
            validator: FormValidators.required,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descrizioneController,
            decoration: const InputDecoration(labelText: 'Descrizione'),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Categoria>(
            value: _selectedCategoria,
            decoration: const InputDecoration(labelText: 'Categoria'),
            items: widget.categorie.map((c) {
              return DropdownMenuItem(
                value: c,
                child: Text(c.nome),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedCategoria = value;
              });
            },
            validator: (value) {
              if (value == null) {
                return 'Seleziona una categoria';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _codiceController,
                  decoration: const InputDecoration(labelText: 'Codice'),
                  validator: FormValidators.required,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _quantitaController,
                  decoration: const InputDecoration(labelText: 'Quantità'),
                  keyboardType: TextInputType.number,
                  validator: FormValidators.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _prezzoAcquistoController,
                  decoration: const InputDecoration(
                    labelText: 'Prezzo Acquisto',
                    prefixText: '€ ',
                  ),
                  keyboardType: TextInputType.number,
                  validator: FormValidators.positiveNumber,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextFormField(
                  controller: _prezzoVenditaController,
                  decoration: const InputDecoration(
                    labelText: 'Prezzo Vendita',
                    prefixText: '€ ',
                  ),
                  keyboardType: TextInputType.number,
                  validator: FormValidators.positiveNumber,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _scorteMinimeController,
            decoration: const InputDecoration(labelText: 'Scorte Minime'),
            keyboardType: TextInputType.number,
            validator: FormValidators.number,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submitForm,
            child: Text(
              widget.ricambio == null
                  ? 'Aggiungi Ricambio'
                  : 'Aggiorna Ricambio',
            ),
          ),
        ],
      ),
    );
  }
}
