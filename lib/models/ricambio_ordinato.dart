import 'package:flutter/foundation.dart';

@immutable
class RicambioOrdinato {
  final String codice;
  final String descrizione;
  final int quantita;
  final double prezzoUnitario;

  const RicambioOrdinato({
    required this.codice,
    required this.descrizione,
    required this.quantita,
    required this.prezzoUnitario,
  });

  double get totale => quantita * prezzoUnitario;

  Map<String, dynamic> toJson() => {
        'codice': codice,
        'descrizione': descrizione,
        'quantita': quantita,
        'prezzoUnitario': prezzoUnitario,
      };

  factory RicambioOrdinato.fromJson(Map<String, dynamic> json) {
    return RicambioOrdinato(
      codice: json['codice'] as String,
      descrizione: json['descrizione'] as String,
      quantita: json['quantita'] as int,
      prezzoUnitario: json['prezzoUnitario'] as double,
    );
  }

  RicambioOrdinato copyWith({
    String? codice,
    String? descrizione,
    int? quantita,
    double? prezzoUnitario,
  }) {
    return RicambioOrdinato(
      codice: codice ?? this.codice,
      descrizione: descrizione ?? this.descrizione,
      quantita: quantita ?? this.quantita,
      prezzoUnitario: prezzoUnitario ?? this.prezzoUnitario,
    );
  }
}
