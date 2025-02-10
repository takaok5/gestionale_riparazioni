import 'package:flutter/material.dart';
import '../enums/enums.dart';

extension TipoMovimentoExtension on TipoMovimento {
  IconData get icon {
    switch (this) {
      case TipoMovimento.carico:
        return Icons.add_box;
      case TipoMovimento.scarico:
        return Icons.remove_circle;
      case TipoMovimento.reso:
        return Icons.replay;
      case TipoMovimento.scarto:
        return Icons.delete;
    }
  }

  Color get color {
    switch (this) {
      case TipoMovimento.carico:
        return Colors.green;
      case TipoMovimento.scarico:
        return Colors.orange;
      case TipoMovimento.reso:
        return Colors.blue;
      case TipoMovimento.scarto:
        return Colors.red;
    }
  }
}

class MovimentoMagazzino {
  final String id;
  final String ricambioId;
  final TipoMovimento tipo;
  final int quantita;
  final String? nota;
  final String operatoreId;
  final DateTime createdAt;

  const MovimentoMagazzino({
    required this.id,
    required this.ricambioId,
    required this.tipo,
    required this.quantita,
    this.nota,
    required this.operatoreId,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'ricambioId': ricambioId,
      'tipo': tipo.toString(),
      'quantita': quantita,
      'nota': nota,
      'operatoreId': operatoreId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory MovimentoMagazzino.fromMap(Map<String, dynamic> map) {
    return MovimentoMagazzino(
      id: map['id'],
      ricambioId: map['ricambioId'],
      tipo: TipoMovimento.values.firstWhere(
        (t) => t.toString() == map['tipo'],
      ),
      quantita: map['quantita'],
      nota: map['nota'],
      operatoreId: map['operatoreId'],
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
}
