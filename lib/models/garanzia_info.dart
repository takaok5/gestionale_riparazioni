import 'package:cloud_firestore/cloud_firestore.dart';

class GaranziaInfo {
  final String id;
  final String numero;
  final DateTime dataInizio;
  final DateTime dataFine;
  final String fornitore;
  final String note;

  GaranziaInfo({
    required this.id,
    required this.numero,
    required this.dataInizio,
    required this.dataFine,
    required this.fornitore,
    this.note = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'numero': numero,
      'dataInizio': Timestamp.fromDate(dataInizio),
      'dataFine': Timestamp.fromDate(dataFine),
      'fornitore': fornitore,
      'note': note,
    };
  }

  factory GaranziaInfo.fromMap(Map<String, dynamic> map) {
    return GaranziaInfo(
      id: map['id'] as String,
      numero: map['numero'] as String,
      dataInizio: (map['dataInizio'] as Timestamp).toDate(),
      dataFine: (map['dataFine'] as Timestamp).toDate(),
      fornitore: map['fornitore'] as String,
      note: map['note'] as String? ?? '',
    );
  }
}
