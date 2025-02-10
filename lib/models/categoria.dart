import '../enums/enums.dart';

class Categoria {
  final String id;
  final String nome;
  final String? descrizione;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Categoria({
    required this.id,
    required this.nome,
    this.descrizione,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'descrizione': descrizione,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Categoria.fromMap(Map<String, dynamic> map) {
    return Categoria(
      id: map['id'] as String,
      nome: map['nome'] as String,
      descrizione: map['descrizione'] as String?,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }
}
