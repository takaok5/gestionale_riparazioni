import 'package:flutter/material.dart';

enum ActivityType { riparazione, magazzino, garanzia, ordine, altro }

class Activity {
  final String id;
  final ActivityType tipo;
  final String descrizione;
  final DateTime timestamp;
  final String? riferimentoId;
  final Widget? actionButton;

  const Activity({
    required this.id,
    required this.tipo,
    required this.descrizione,
    required this.timestamp,
    this.riferimentoId,
    this.actionButton,
  });

  factory Activity.fromMap(Map<String, dynamic> map) {
    return Activity(
      id: map['id'] as String,
      tipo: ActivityType.values.firstWhere(
        (t) => t.toString() == 'ActivityType.${map['tipo']}',
        orElse: () => ActivityType.altro,
      ),
      descrizione: map['descrizione'] as String,
      timestamp: DateTime.parse(map['timestamp'] as String),
      riferimentoId: map['riferimentoId'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tipo': tipo.toString().split('.').last,
      'descrizione': descrizione,
      'timestamp': timestamp.toIso8601String(),
      'riferimentoId': riferimentoId,
    };
  }
}
