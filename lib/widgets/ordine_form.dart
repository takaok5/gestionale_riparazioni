import 'package:flutter/material.dart';
import '../models/ordine.dart';
import '../models/fornitore.dart';
import '../models/ricambio.dart';
import '../models/stato_ordine.dart';
import '../services/fornitori_service.dart';
import '../services/inventory_service.dart';
import '../utils/form_validators.dart';
import 'aggiungi_ricambio_dialog.dart';

class OrdineForm extends StatefulWidget {
  final Ordine? ordine;
  final List<Fornitore> fornitori;
  final List<Ricambio> ricambi;
  final Function(Ordine) onSubmit;

  const OrdineForm({
    Key? key,
    this.ordine,
    required this.fornitori,
    required this.ricambi,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<OrdineForm> createState() => _OrdineFormState();
}

class _OrdineFormState extends State<OrdineForm> {
  final _formKey = GlobalKey<FormState>();
  late Fornitore? _fornitoreSelezionato;
  final List<RicambioOrdine> _ricambiSelezionati = [];
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.ordine != null) {
      _fornitoreSelezionato = widget.fornitori.firstWhere(
        (f) => f.id == widget.ordine!.fornitoreId,
      );
      _ricambiSelezionati.addAll(widget.ordine!.ricambi);
      _noteController.text = widget.ordine!.note ?? '';
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _aggiungiRicambio() async {
    final result = await showDialog<RicambioOrdine>(
      context: context,
      builder: (context) => AggiungiRicambioDialog(
        ricambi: widget.ricambi,
        ricambiEsistenti: _ricambiSelezionati.map((r) => r.ricambioId).toList(),
      ),
    );

    if (result != null) {
      setState(() {
        _ricambiSelezionati.add(result);
      });
    }
  }

  void _rimuoviRicambio(int index) {
    setState(() {
      _ricambiSelezionati.removeAt(index);
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate() && _fornitoreSelezionato != null) {
      final ordine = Ordine(
        id: widget.ordine?.id ?? '',
        fornitoreId: _fornitoreSelezionato!.id,
        ricambi: _ricambiSelezionati,
        stato: widget.ordine?.stato ?? StatoOrdine.inAttesa,
        dataOrdine: widget.ordine?.dataOrdine ?? DateTime.now(),
        note: _noteController.text.isEmpty ? null : _noteController.text,
        totale: _ricambiSelezionati.fold(
          0.0,
          (sum, item) => sum + (item.prezzo * item.quantita),
        ),
      );

      widget.onSubmit(ordine);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<Fornitore>(
            value: _fornitoreSelezionato,
            decoration: const InputDecoration(
              labelText: 'Fornitore *',
            ),
            items: widget.fornitori.map((fornitore) {
              return DropdownMenuItem(
                value: fornitore,
                child: Text(fornitore.ragioneSociale),
              );
            }).toList(),
            validator: (value) {
              if (value == null) {
                return 'Seleziona un fornitore';
              }
              return null;
            },
            onChanged: (value) {
              setState(() => _fornitoreSelezionato = value);
            },
          ),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Ricambi'),
            trailing: IconButton(
              icon: const Icon(Icons.add),
              onPressed: _aggiungiRicambio,
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _ricambiSelezionati.length,
            itemBuilder: (context, index) {
              final ricambio = _ricambiSelezionati[index];
              final ricambioInfo = widget.ricambi.firstWhere(
                (r) => r.id == ricambio.ricambioId,
              );
              return ListTile(
                title: Text(ricambioInfo.nome),
                subtitle: Text(
                  'Quantità: ${ricambio.quantita} - Prezzo: €${ricambio.prezzo.toStringAsFixed(2)}',
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: () => _rimuoviRicambio(index),
                ),
              );
            },
          ),
          if (_ricambiSelezionati.isEmpty)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Text(
                'Nessun ricambio selezionato',
                style: TextStyle(fontStyle: FontStyle.italic),
              ),
            ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _noteController,
            decoration: const InputDecoration(
              labelText: 'Note',
              hintText: 'Aggiungi eventuali note...',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submit,
            child:
                Text(widget.ordine == null ? 'Crea Ordine' : 'Aggiorna Ordine'),
          ),
        ],
      ),
    );
  }
}

class RicambioOrdine {
  final String ricambioId;
  final int quantita;
  final double prezzo;

  RicambioOrdine({
    required this.ricambioId,
    required this.quantita,
    required this.prezzo,
  });
}
