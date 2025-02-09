import 'package:flutter/material.dart';
import '../models/ricambio.dart';
import 'ordine_form.dart';

class AggiungiRicambioDialog extends StatefulWidget {
  final List<Ricambio> ricambi;
  final List<String> ricambiEsistenti;

  const AggiungiRicambioDialog({
    Key? key,
    required this.ricambi,
    required this.ricambiEsistenti,
  }) : super(key: key);

  @override
  State<AggiungiRicambioDialog> createState() => _AggiungiRicambioDialogState();
}

class _AggiungiRicambioDialogState extends State<AggiungiRicambioDialog> {
  Ricambio? _ricambioSelezionato;
  final _quantitaController = TextEditingController(text: '1');
  final _prezzoController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _quantitaController.dispose();
    _prezzoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Aggiungi Ricambio'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<Ricambio>(
              value: _ricambioSelezionato,
              decoration: const InputDecoration(
                labelText: 'Ricambio *',
              ),
              items: widget.ricambi
                  .where((r) => !widget.ricambiEsistenti.contains(r.id))
                  .map((ricambio) {
                return DropdownMenuItem(
                  value: ricambio,
                  child: Text(ricambio.nome),
                );
              }).toList(),
              validator: (value) {
                if (value == null) return 'Seleziona un ricambio';
                return null;
              },
              onChanged: (value) {
                setState(() {
                  _ricambioSelezionato = value;
                  if (value != null) {
                    _prezzoController.text = value.prezzoAcquisto.toString();
                  }
                });
              },
            ),
            TextFormField(
              controller: _quantitaController,
              decoration: const InputDecoration(
                labelText: 'Quantità *',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty)
                  return 'Inserisci una quantità';
                if (int.tryParse(value) == null || int.parse(value) <= 0) {
                  return 'Inserisci un numero valido';
                }
                return null;
              },
            ),
            TextFormField(
              controller: _prezzoController,
              decoration: const InputDecoration(
                labelText: 'Prezzo unitario *',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty)
                  return 'Inserisci un prezzo';
                if (double.tryParse(value) == null ||
                    double.parse(value) <= 0) {
                  return 'Inserisci un prezzo valido';
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annulla'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate() &&
                _ricambioSelezionato != null) {
              Navigator.of(context).pop(
                RicambioOrdine(
                  ricambioId: _ricambioSelezionato!.id,
                  quantita: int.parse(_quantitaController.text),
                  prezzo: double.parse(_prezzoController.text),
                ),
              );
            }
          },
          child: const Text('Aggiungi'),
        ),
      ],
    );
  }
}
