import 'package:equatable/equatable.dart';
import '../utils/exceptions.dart';
import '../enums/enums.dart';

class UserProfile extends Equatable {
  final String id;
  final String email;
  final String nome;
  final String cognome;
  final UserRole ruolo;
  final String? telefono;
  final Map<String, bool> permessi;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? avatarUrl;
  final Map<String, dynamic>? metadata;

  const UserProfile({
    required this.id,
    required this.email,
    required this.nome,
    required this.cognome,
    required this.ruolo,
    this.telefono,
    Map<String, bool>? permessi,
    this.isActive = true,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.avatarUrl,
    this.metadata,
  })  : permessi = permessi ?? const {},
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Getter per il nome completo
  String get nomeCompleto => '$nome $cognome';

  // Verifica se l'utente ha un determinato permesso
  bool hasPermission(String permission) {
    return permessi[permission] ?? false;
  }

  // Verifica se l'utente ha un ruolo superiore o uguale
  bool hasRole(UserRole minimumRole) {
    return ruolo.index <= minimumRole.index;
  }

  // Copia con modifiche
  UserProfile copyWith({
    String? id,
    String? email,
    String? nome,
    String? cognome,
    UserRole? ruolo,
    String? telefono,
    Map<String, bool>? permessi,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? avatarUrl,
    Map<String, dynamic>? metadata,
  }) {
    return UserProfile(
      id: id ?? this.id,
      email: email ?? this.email,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      ruolo: ruolo ?? this.ruolo,
      telefono: telefono ?? this.telefono,
      permessi: permessi ?? Map.from(this.permessi),
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      avatarUrl: avatarUrl ?? this.avatarUrl,
      metadata: metadata != null
          ? Map.from(metadata)
          : this.metadata?.map((k, v) => MapEntry(k, v)),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'nome': nome,
      'cognome': cognome,
      'ruolo': ruolo.toString(),
      'telefono': telefono,
      'permessi': permessi,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'avatarUrl': avatarUrl,
      'metadata': metadata,
    };
  }

  factory UserProfile.fromMap(Map<String, dynamic> map) {
    try {
      return UserProfile(
        id: map['id'] as String,
        email: map['email'] as String,
        nome: map['nome'] as String,
        cognome: map['cognome'] as String,
        ruolo: UserRole.values.firstWhere(
          (r) => r.toString() == map['ruolo'],
          orElse: () => UserRole.user,
        ),
        telefono: map['telefono'] as String?,
        permessi: Map<String, bool>.from(map['permessi'] ?? {}),
        isActive: map['isActive'] as bool? ?? true,
        createdAt: map['createdAt'] != null
            ? DateTime.parse(map['createdAt'] as String)
            : DateTime.now(),
        updatedAt: map['updatedAt'] != null
            ? DateTime.parse(map['updatedAt'] as String)
            : DateTime.now(),
        avatarUrl: map['avatarUrl'] as String?,
        metadata: map['metadata'] as Map<String, dynamic>?,
      );
    } catch (e) {
      throw ValidationException(
        'Errore nella conversione del profilo utente',
        details: e.toString(),
      );
    }
  }

  // Validazione del profilo
  void validate() {
    if (email.isEmpty) {
      throw ValidationException('Email non può essere vuota');
    }
    if (!RegExp(r'^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$')
        .hasMatch(email)) {
      throw ValidationException('Email non valida');
    }
    if (nome.isEmpty) {
      throw ValidationException('Nome non può essere vuoto');
    }
    if (cognome.isEmpty) {
      throw ValidationException('Cognome non può essere vuoto');
    }
    if (telefono != null && telefono!.isNotEmpty) {
      if (!RegExp(r'^\+?[0-9]{10,13}$').hasMatch(telefono!)) {
        throw ValidationException('Numero di telefono non valido');
      }
    }
  }

  @override
  List<Object?> get props => [
        id,
        email,
        nome,
        cognome,
        ruolo,
        telefono,
        permessi,
        isActive,
        createdAt,
        updatedAt,
        avatarUrl,
        metadata,
      ];

  @override
  String toString() =>
      'UserProfile(id: $id, email: $email, nome: $nomeCompleto, ruolo: $ruolo)';
}
