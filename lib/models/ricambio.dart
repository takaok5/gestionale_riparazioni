import 'package:flutter/foundation.dart';
import '../models/categoria.dart';
import 'package:flutter/material.dart';
import './categoria.dart';
import 'enums/enums.dart';

class Ricambio {
  final String id;
  final String nome;
  final String descrizione;
  final String codice;
  final Categoria categoria;
  final int quantita;
  final double prezzoAcquisto;
  final double prezzoVendita;
  final int scorteMinime;
  final String? ubicazione;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Ricambio({
    required this.id,
    required this.nome,
    required this.descrizione,
    required this.codice,
    required this.categoria,
    required this.quantita,
    required this.prezzoAcquisto,
    required this.prezzoVendita,
    required this.scorteMinime,
    this.ubicazione,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  bool get sottoScorta => quantita <= scorteMinime;

  double get margine => prezzoVendita - prezzoAcquisto;

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'descrizione': descrizione,
      'codice': codice,
      'categoriaId': categoria.id,
      'quantita': quantita,
      'prezzoAcquisto': prezzoAcquisto,
      'prezzoVendita': prezzoVendita,
      'scorteMinime': scorteMinime,
      'ubicazione': ubicazione,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Ricambio.fromMap(Map<String, dynamic> map,
      {required Categoria categoria}) {
    return Ricambio(
      id: map['id'] as String,
      nome: map['nome'] as String,
      descrizione: map['descrizione'] as String,
      codice: map['codice'] as String,
      categoria: categoria,
      quantita: map['quantita'] as int,
      prezzoAcquisto: (map['prezzoAcquisto'] as num).toDouble(),
      prezzoVendita: (map['prezzoVendita'] as num).toDouble(),
      scorteMinime: map['scorteMinime'] as int,
      ubicazione: map['ubicazione'] as String?,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  Ricambio copyWith({
    String? id,
    String? nome,
    String? descrizione,
    String? codice,
    Categoria? categoria,
    int? quantita,
    double? prezzoAcquisto,
    double? prezzoVendita,
    int? scorteMinime,
    String? ubicazione,
  }) {
    return Ricambio(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      descrizione: descrizione ?? this.descrizione,
      codice: codice ?? this.codice,
      categoria: categoria ?? this.categoria,
      quantita: quantita ?? this.quantita,
      prezzoAcquisto: prezzoAcquisto ?? this.prezzoAcquisto,
      prezzoVendita: prezzoVendita ?? this.prezzoVendita,
      scorteMinime: scorteMinime ?? this.scorteMinime,
      ubicazione: ubicazione ?? this.ubicazione,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
