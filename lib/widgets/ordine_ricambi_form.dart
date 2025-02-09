import 'package:flutter/material.dart';

// Definiamo qui le classi necessarie per evitare errori di dipendenza
enum StatoOrdine { inAttesa, confermato, spedito, consegnato, annullato }

class RicambioOrdinato {
  final String codice;
  final String descrizione;
  final int quantita;
  final double prezzoUnitario;

  const RicambioOrdinato({
    required this.codice,
    required this.descrizione,
    required this.quantita,
    required this.prezzoUnitario,
  });
}

class OrdineRicambi {
  final String id;
  final String fornitoreId;
  final String numeroOrdine;
  final DateTime dataOrdine;
  final List<RicambioOrdinato> ricambi;
  final StatoOrdine stato;
  final double totale;
  final String? note;

  const OrdineRicambi({
    required this.id,
    required this.fornitoreId,
    required this.numeroOrdine,
    required this.dataOrdine,
    required this.ricambi,
    required this.stato,
    required this.totale,
    this.note,
  });
}

class Fornitore {
  final String id;
  final String nome;

  const Fornitore({
    required this.id,
    required this.nome,
  });
}

class OrdineRicambiForm extends StatefulWidget {
  final Fornitore fornitore;
  final OrdineRicambi? ordine;
  final Function(OrdineRicambi) onSave;

  const OrdineRicambiForm({
    Key? key,
    required this.fornitore,
    this.ordine,
    required this.onSave,
  }) : super(key: key);

  @override
  _OrdineRicambiFormState createState() => _OrdineRicambiFormState();
}

class _OrdineRicambiFormState extends State<OrdineRicambiForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _numeroOrdineController;
  late TextEditingController _noteController;
  List<RicambioOrdinato> _ricambi = [];
  late StatoOrdine _statoOrdine;

  @override
  void initState() {
    super.initState();
    _numeroOrdineController =
        TextEditingController(text: widget.ordine?.numeroOrdine ?? '');
    _noteController = TextEditingController(text: widget.ordine?.note ?? '');
    _ricambi = widget.ordine?.ricambi ?? [];
    _statoOrdine = widget.ordine?.stato ?? StatoOrdine.inAttesa;
  }

  @override
  void dispose() {
    _numeroOrdineController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _addRicambio() {
    showDialog(
      context: context,
      builder: (context) => _RicambioDialog(
        onAdd: (ricambio) {
          setState(() {
            _ricambi.add(ricambio);
          });
        },
      ),
    );
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _ricambi.isNotEmpty) {
      final ordine = OrdineRicambi(
        id: widget.ordine?.id ??
            DateTime.now().millisecondsSinceEpoch.toString(),
        fornitoreId: widget.fornitore.id,
        numeroOrdine: _numeroOrdineController.text,
        dataOrdine: DateTime.now(),
        ricambi: _ricambi,
        stato: _statoOrdine,
        totale: _ricambi.fold(
            0, (sum, item) => sum + (item.prezzoUnitario * item.quantita)),
        note: _noteController.text.isEmpty ? null : _noteController.text,
      );
      widget.onSave(ordine);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _numeroOrdineController,
            decoration: const InputDecoration(
              labelText: 'Numero Ordine*',
              hintText: 'Inserisci il numero dell\'ordine',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Inserire il numero ordine';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<StatoOrdine>(
            value: _statoOrdine,
            decoration: const InputDecoration(labelText: 'Stato'),
            items: StatoOrdine.values.map((stato) {
              return DropdownMenuItem(
                value: stato,
                child: Text(stato.toString().split('.').last),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _statoOrdine = value;
                });
              }
            },
          ),
          const SizedBox(height: 24),
          Text(
            'Ricambi Ordinati:',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          if (_ricambi.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Text(
                'Nessun ricambio aggiunto',
                style: TextStyle(fontStyle: FontStyle.italic),
              ),
            ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _ricambi.length,
            itemBuilder: (context, index) {
              final ricambio = _ricambi[index];
              return Card(
                child: ListTile(
                  title: Text(ricambio.descrizione),
                  subtitle: Text(
                    '${ricambio.quantita}x €${ricambio.prezzoUnitario.toStringAsFixed(2)}',
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () {
                      setState(() {
                        _ricambi.removeAt(index);
                      });
                    },
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _addRicambio,
            icon: const Icon(Icons.add),
            label: const Text('Aggiungi Ricambio'),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(
              labelText: 'Note',
              hintText: 'Inserisci eventuali note',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _ricambi.isEmpty ? null : _submitForm,
            child: Text(
              widget.ordine == null ? 'Crea Ordine' : 'Aggiorna Ordine',
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class _RicambioDialog extends StatefulWidget {
  final Function(RicambioOrdinato) onAdd;

  const _RicambioDialog({
    required this.onAdd,
  });

  @override
  _RicambioDialogState createState() => _RicambioDialogState();
}

class _RicambioDialogState extends State<_RicambioDialog> {
  final _formKey = GlobalKey<FormState>();
  final _codiceController = TextEditingController();
  final _descrizioneController = TextEditingController();
  final _quantitaController = TextEditingController();
  final _prezzoController = TextEditingController();

  @override
  void dispose() {
    _codiceController.dispose();
    _descrizioneController.dispose();
    _quantitaController.dispose();
    _prezzoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Aggiungi Ricambio'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _codiceController,
                decoration: const InputDecoration(
                  labelText: 'Codice*',
                  hintText: 'Inserisci il codice del ricambio',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Inserire il codice';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descrizioneController,
                decoration: const InputDecoration(
                  labelText: 'Descrizione*',
                  hintText: 'Inserisci la descrizione del ricambio',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Inserire la descrizione';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _quantitaController,
                decoration: const InputDecoration(
                  labelText: 'Quantità*',
                  hintText: 'Inserisci la quantità',
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Inserire la quantità';
                  }
                  if (int.tryParse(value) == null || int.parse(value) <= 0) {
                    return 'Inserire una quantità valida';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _prezzoController,
                decoration: const InputDecoration(
                  labelText: 'Prezzo Unitario*',
                  hintText: 'Inserisci il prezzo unitario',
                  prefixText: '€ ',
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Inserire il prezzo';
                  }
                  if (double.tryParse(value) == null ||
                      double.parse(value) <= 0) {
                    return 'Inserire un prezzo valido';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Annulla'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              widget.onAdd(RicambioOrdinato(
                codice: _codiceController.text,
                descrizione: _descrizioneController.text,
                quantita: int.parse(_quantitaController.text),
                prezzoUnitario: double.parse(_prezzoController.text),
              ));
              Navigator.of(context).pop();
            }
          },
          child: const Text('Aggiungi'),
        ),
      ],
    );
  }
}
