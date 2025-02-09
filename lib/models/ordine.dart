import 'package:flutter/material.dart';
import 'ricambio.dart';
import 'fornitore.dart';
import 'enums.dart';

class Ordine {
  final String id;
  final String numeroOrdine; // Cambiato da numero a numeroOrdine
  final Fornitore
      fornitore; // Aggiunto fornitore come oggetto invece di fornitoreId
  final String note;
  final List<OrdineRicambio> ricambi;
  final StatoOrdine stato;
  final DateTime dataOrdine;
  final DateTime? dataConsegna;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Ordine({
    required this.id,
    required this.numeroOrdine,
    required this.fornitore,
    required this.note,
    required this.ricambi,
    required this.stato,
    required this.dataOrdine,
    this.dataConsegna,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  double get totale => ricambi.fold(0, (sum, item) => sum + item.totale);

  Map<String, dynamic> toMap() {
    return {
      'numeroOrdine': numeroOrdine,
      'fornitoreId': fornitore.id,
      'note': note,
      'ricambi': ricambi.map((r) => r.toMap()).toList(),
      'stato': stato.toString(),
      'dataOrdine': dataOrdine.toIso8601String(),
      'dataConsegna': dataConsegna?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Ordine.fromMap(Map<String, dynamic> map,
      {required Fornitore fornitore}) {
    return Ordine(
      id: map['id'] as String,
      numeroOrdine: map['numeroOrdine'] as String,
      fornitore: fornitore,
      note: map['note'] as String,
      ricambi: (map['ricambi'] as List)
          .map((r) => OrdineRicambio.fromMap(r))
          .toList(),
      stato: StatoOrdine.values.firstWhere(
        (s) => s.toString() == map['stato'],
      ),
      dataOrdine: DateTime.parse(map['dataOrdine'] as String),
      dataConsegna: map['dataConsegna'] != null
          ? DateTime.parse(map['dataConsegna'] as String)
          : null,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }
}
