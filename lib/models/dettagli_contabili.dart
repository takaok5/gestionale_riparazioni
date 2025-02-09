import 'package:meta/meta.dart';

double get totale => importoTotale;
double get costoRicambi => 0.0; // Implementa la logica appropriata
double get costoManodopera => 0.0; // Implementa la logica appropriata
bool get pagato => pagato;
double? get scontoApplicato => scontoApplicato;

@immutable
class DettagliContabili {
  final double importo;
  final double? scontoApplicato;
  final bool pagato;
  final String? metodoPagamento;
  final DateTime? dataPagamento;

  double get importoTotale {
    if (scontoApplicato == null) return importo;
    return importo - (importo * scontoApplicato! / 100);
  }

  const DettagliContabili({
    required this.importo,
    this.scontoApplicato,
    this.pagato = false,
    this.metodoPagamento,
    this.dataPagamento,
  });

  factory DettagliContabili.fromMap(Map<String, dynamic> map) {
    return DettagliContabili(
      importo: (map['importo'] as num).toDouble(),
      scontoApplicato: map['scontoApplicato'] != null
          ? (map['scontoApplicato'] as num).toDouble()
          : null,
      pagato: map['pagato'] as bool? ?? false,
      metodoPagamento: map['metodoPagamento'] as String?,
      dataPagamento: map['dataPagamento'] != null
          ? DateTime.parse(map['dataPagamento'] as String)
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'importo': importo,
      'scontoApplicato': scontoApplicato,
      'pagato': pagato,
      'metodoPagamento': metodoPagamento,
      'dataPagamento': dataPagamento?.toIso8601String(),
    };
  }
}
