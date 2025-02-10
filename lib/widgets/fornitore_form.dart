import 'package:flutter/material.dart';
import '../models/fornitore.dart';
import '../utils/validators.dart';

class FornitoreForm extends StatelessWidget {
  final String nome;
  final String partitaIva;

  const FornitoreForm({
    Key? key,
    required this.nome,
    required this.partitaIva,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    bool isPartitaValida = Validators.isValidPartitaIva(partitaIva);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Nome: $nome'),
        Text('Partita IVA: $partitaIva'),
        Text('Validità: ${isPartitaValida ? "Valida" : "Non valida"}'),
      ],
    );
  }
}
