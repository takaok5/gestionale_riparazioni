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
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'cognome': cognome,
      'email': email,
      'telefono': telefono,
      'indirizzo': indirizzo,
      'note': note,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
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
    );
  }
}
