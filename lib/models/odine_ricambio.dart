import 'package:cloud_firestore/cloud_firestore.dart';

class OrdineRicambio {
  final String id;
  final String ricambioId;
  final int quantita;
  final double prezzoUnitario;
  final DateTime dataOrdine;
  final DateTime? dataConsegna;

  OrdineRicambio({
    required this.id,
    required this.ricambioId,
    required this.quantita,
    required this.prezzoUnitario,
    required this.dataOrdine,
    this.dataConsegna,
  });

  double get totale => quantita * prezzoUnitario;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'ricambioId': ricambioId,
      'quantita': quantita,
      'prezzoUnitario': prezzoUnitario,
      'dataOrdine': dataOrdine.toIso8601String(),
      'dataConsegna': dataConsegna?.toIso8601String(),
    };
  }

  factory OrdineRicambio.fromMap(Map<String, dynamic> map) {
    return OrdineRicambio(
      id: map['id'] as String,
      ricambioId: map['ricambioId'] as String,
      quantita: map['quantita'] as int,
      prezzoUnitario: map['prezzoUnitario'] as double,
      dataOrdine: DateTime.parse(map['dataOrdine'] as String),
      dataConsegna: map['dataConsegna'] != null
          ? DateTime.parse(map['dataConsegna'] as String)
          : null,
    );
  }
}
