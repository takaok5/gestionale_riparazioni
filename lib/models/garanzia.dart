import 'package:meta/meta.dart';
import './base_model.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

enum StatoGaranzia { attiva, scaduta, invalidata }

class Garanzia {
  final String id;
  final String prodotto;
  final DateTime dataInizio;
  final DateTime dataFine;
  final String? seriale;
  final String? note;
  final StatoGaranzia stato;
  final DateTime createdAt;
  final DateTime updatedAt;

  Garanzia({
    required this.id,
    required this.prodotto,
    required this.dataInizio,
    required this.dataFine,
    this.seriale,
    this.note,
    required this.stato,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isActive =>
      stato == StatoGaranzia.attiva && dataFine.isAfter(DateTime.now());

  Duration get durata => dataFine.difference(dataInizio);

  Duration get rimanente => dataFine.difference(DateTime.now());

  Map<String, dynamic> toMap() {
    return {
      'prodotto': prodotto,
      'dataInizio': Timestamp.fromDate(dataInizio),
      'dataFine': Timestamp.fromDate(dataFine),
      'seriale': seriale,
      'note': note,
      'stato': stato.toString(),
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  factory Garanzia.fromMap(Map<String, dynamic> map) {
    return Garanzia(
      id: map['id'] ?? '',
      prodotto: map['prodotto'] ?? '',
      dataInizio: (map['dataInizio'] as Timestamp).toDate(),
      dataFine: (map['dataFine'] as Timestamp).toDate(),
      seriale: map['seriale'],
      note: map['note'],
      stato: StatoGaranzia.values.firstWhere(
        (e) => e.toString() == map['stato'],
        orElse: () => StatoGaranzia.attiva,
      ),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Garanzia copyWith({
    String? id,
    String? prodotto,
    DateTime? dataInizio,
    DateTime? dataFine,
    String? seriale,
    String? note,
    StatoGaranzia? stato,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Garanzia(
      id: id ?? this.id,
      prodotto: prodotto ?? this.prodotto,
      dataInizio: dataInizio ?? this.dataInizio,
      dataFine: dataFine ?? this.dataFine,
      seriale: seriale ?? this.seriale,
      note: note ?? this.note,
      stato: stato ?? this.stato,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
