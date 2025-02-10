import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

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

  // Getters per le date formattate
  String get dataCreazione => AppDateUtils.formatDate(createdAt);
  String get dataCreazioneCompleta => AppDateUtils.formatDateTime(createdAt);
  String get ultimoAggiornamento => AppDateUtils.formatDateTime(updatedAt);
  String get tempoTrascorso => AppDateUtils.timeAgo(createdAt);
  String get ultimaModifica => AppDateUtils.timeAgo(updatedAt);

  Map<String, dynamic> toMap() {
    return {
      'nome': nome,
      'descrizione': descrizione,
      'createdAt': AppDateUtils.toISOString(createdAt),
      'updatedAt': AppDateUtils.toISOString(updatedAt),
    };
  }

  factory Categoria.fromMap(Map<String, dynamic> map) {
    return Categoria(
      id: map['id'] as String,
      nome: map['nome'] as String,
      descrizione: map['descrizione'] as String?,
      createdAt: AppDateUtils.parseISOString(map['createdAt']) ?? DateTime.now(),
      updatedAt: AppDateUtils.parseISOString(map['updatedAt']) ?? DateTime.now(),
    );
  }

  // Metodo di utilità per creare una copia con modifiche
  Categoria copyWith({
    String? id,
    String? nome,
    String? descrizione,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Categoria(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      descrizione: descrizione ?? this.descrizione,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}