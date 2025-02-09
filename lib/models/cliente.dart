import 'package:cloud_firestore/cloud_firestore.dart';

class Cliente {
  final String id;
  final String nome;
  final String cognome;
  final String email;
  final String telefono;
  final String? indirizzo;
  final String? note;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? codiceFiscale;
  final String? partitaIva;
  final String? pec;
  final String? stato;

  Cliente({
    required this.id,
    required this.nome,
    required this.cognome,
    required this.email,
    required this.telefono,
    this.indirizzo,
    this.note,
    required this.createdAt,
    required this.updatedAt,
    this.codiceFiscale,
    this.partitaIva,
    this.pec,
    this.stato,
  });

  String get nominativo => '$nome $cognome';

  Cliente copyWith({
    String? id,
    String? nome,
    String? cognome,
    String? email,
    String? telefono,
    String? indirizzo,
    String? note,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? codiceFiscale,
    String? partitaIva,
    String? pec,
    String? stato,
  }) {
    return Cliente(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      email: email ?? this.email,
      telefono: telefono ?? this.telefono,
      indirizzo: indirizzo ?? this.indirizzo,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      codiceFiscale: codiceFiscale ?? this.codiceFiscale,
      partitaIva: partitaIva ?? this.partitaIva,
      pec: pec ?? this.pec,
      stato: stato ?? this.stato,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome': nome,
      'cognome': cognome,
      'email': email,
      'telefono': telefono,
      'indirizzo': indirizzo,
      'note': note,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'codiceFiscale': codiceFiscale,
      'partitaIva': partitaIva,
      'pec': pec,
      'stato': stato,
    };
  }

  factory Cliente.fromMap(Map<String, dynamic> map) {
    return Cliente(
      id: map['id'] ?? '',
      nome: map['nome'] ?? '',
      cognome: map['cognome'] ?? '',
      email: map['email'] ?? '',
      telefono: map['telefono'] ?? '',
      indirizzo: map['indirizzo'],
      note: map['note'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
      codiceFiscale: map['codiceFiscale'],
      partitaIva: map['partitaIva'],
      pec: map['pec'],
      stato: map['stato'],
    );
  }
}
