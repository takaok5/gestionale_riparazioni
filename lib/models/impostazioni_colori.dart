import 'package:flutter/material.dart';

class ImpostazioniColori {
  final Color colorePrimario;
  final Color coloreSecondario;
  final Color coloreSfondo;

  const ImpostazioniColori({
    required this.colorePrimario,
    required this.coloreSecondario,
    required this.coloreSfondo,
  });

  factory ImpostazioniColori.predefinito() {
    return const ImpostazioniColori(
      colorePrimario: Colors.blue,
      coloreSecondario: Colors.blueAccent,
      coloreSfondo: Colors.white,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'colorePrimario': colorePrimario.value,
      'coloreSecondario': coloreSecondario.value,
      'coloreSfondo': coloreSfondo.value,
    };
  }

  factory ImpostazioniColori.fromMap(Map<String, dynamic> map) {
    return ImpostazioniColori(
      colorePrimario: Color(map['colorePrimario'] as int),
      coloreSecondario: Color(map['coloreSecondario'] as int),
      coloreSfondo: Color(map['coloreSfondo'] as int),
    );
  }

  ImpostazioniColori copyWith({
    Color? colorePrimario,
    Color? coloreSecondario,
    Color? coloreSfondo,
  }) {
    return ImpostazioniColori(
      colorePrimario: colorePrimario ?? this.colorePrimario,
      coloreSecondario: coloreSecondario ?? this.coloreSecondario,
      coloreSfondo: coloreSfondo ?? this.coloreSfondo,
    );
  }
}
