import 'package:flutter/material.dart';
import '../enums/enums.dart';

class ImpostazioniColori {
  final Color colorePrimario;
  final Color coloreSecondario;
  final Color coloreSfondo;
  final String id;
  final Map<String, String> colori;

  const ImpostazioniColori({
    required this.colorePrimario,
    required this.coloreSecondario,
    required this.coloreSfondo,
    required this.id,
    required this.colori,
  });

  factory ImpostazioniColori.predefinito() {
    return const ImpostazioniColori(
      colorePrimario: Colors.blue,
      coloreSecondario: Colors.blueAccent,
      coloreSfondo: Colors.white,
      id: 'default',
      colori: {
        'primary': '#1976D2',
        'secondary': '#424242',
        'accent': '#FF4081',
      },
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'colorePrimario': colorePrimario.value,
      'coloreSecondario': coloreSecondario.value,
      'coloreSfondo': coloreSfondo.value,
      'id': id,
      'colori': colori,
    };
  }

  factory ImpostazioniColori.fromMap(Map<String, dynamic> map) {
    return ImpostazioniColori(
      colorePrimario: Color(map['colorePrimario'] as int),
      coloreSecondario: Color(map['coloreSecondario'] as int),
      coloreSfondo: Color(map['coloreSfondo'] as int),
      id: map['id'] ?? 'default',
      colori: Map<String, String>.from(map['colori'] ??
          {
            'primary': '#1976D2',
            'secondary': '#424242',
            'accent': '#FF4081',
          }),
    );
  }

  ImpostazioniColori copyWith({
    Color? colorePrimario,
    Color? coloreSecondario,
    Color? coloreSfondo,
    String? id,
    Map<String, String>? colori,
  }) {
    return ImpostazioniColori(
      colorePrimario: colorePrimario ?? this.colorePrimario,
      coloreSecondario: coloreSecondario ?? this.coloreSecondario,
      coloreSfondo: coloreSfondo ?? this.coloreSfondo,
      id: id ?? this.id,
      colori: colori ?? this.colori,
    );
  }
}
