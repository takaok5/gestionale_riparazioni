import 'package:meta/meta.dart';

@immutable
class DettagliContabili {
  final double importo;
  final double? scontoApplicato;
  final bool pagato;
  final String? metodoPagamento;
  final DateTime? dataPagamento;

  // Rimossi i getter ricorsivi e aggiunti correttamente
  double get importoTotale {
    if (scontoApplicato == null) return importo;
    return importo - (importo * scontoApplicato! / 100);
  }

  double get totale => importoTotale;
  double get costoRicambi => 0.0; // Implementa la logica appropriata
  double get costoManodopera => 0.0; // Implementa la logica appropriata
  // Rimosso il getter ricorsivo pagato
  // Rimosso il getter ricorsivo scontoApplicato

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