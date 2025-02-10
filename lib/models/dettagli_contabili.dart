import 'package:meta/meta.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

@immutable
class DettagliContabili {
  final double importo;
  final double? scontoApplicato;
  final bool pagato;
  final String? metodoPagamento;
  final DateTime? dataPagamento;

  // Getters per l'importo
  double get importoTotale {
    if (scontoApplicato == null) return importo;
    return importo - (importo * scontoApplicato! / 100);
  }

  double get totale => importoTotale;
  double get costoRicambi => 0.0; // Implementa la logica appropriata
  double get costoManodopera => 0.0; // Implementa la logica appropriata

  // Getters per le date formattate
  String? get dataPagamentoFormattata =>
      dataPagamento != null ? AppDateUtils.formatDate(dataPagamento!) : null;

  String? get dataPagamentoCompleta => dataPagamento != null
      ? AppDateUtils.formatDateTime(dataPagamento!)
      : null;

  String? get tempoTrascorsoDalPagamento =>
      dataPagamento != null ? AppDateUtils.timeAgo(dataPagamento!) : null;

  // Getters per lo stato del pagamento
  bool get isPagamentoRecente =>
      dataPagamento != null && AppDateUtils.isWithinDays(dataPagamento!, 7);

  String get statoPagamento => pagato
      ? 'Pagato il ${dataPagamentoFormattata ?? "data non disponibile"}'
      : 'Non pagato';

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
          ? AppDateUtils.parseISOString(map['dataPagamento'] as String)
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'importo': importo,
      'scontoApplicato': scontoApplicato,
      'pagato': pagato,
      'metodoPagamento': metodoPagamento,
      'dataPagamento': dataPagamento != null
          ? AppDateUtils.toISOString(dataPagamento!)
          : null,
    };
  }

  // Metodo di utilità per creare una copia con modifiche
  DettagliContabili copyWith({
    double? importo,
    double? scontoApplicato,
    bool? pagato,
    String? metodoPagamento,
    DateTime? dataPagamento,
  }) {
    return DettagliContabili(
      importo: importo ?? this.importo,
      scontoApplicato: scontoApplicato ?? this.scontoApplicato,
      pagato: pagato ?? this.pagato,
      metodoPagamento: metodoPagamento ?? this.metodoPagamento,
      dataPagamento: dataPagamento ?? this.dataPagamento,
    );
  }

  // Metodo per formattare l'importo come stringa di valuta
  String getImportoFormattato({bool conSconto = true}) {
    final importoDaMostrare = conSconto ? importoTotale : importo;
    return '€${importoDaMostrare.toStringAsFixed(2)}';
  }

  // Metodo per ottenere una descrizione completa del pagamento
  String getDescrizionePagamento() {
    if (!pagato) return 'Non pagato';

    final data = dataPagamentoFormattata ?? 'data non disponibile';
    final metodo = metodoPagamento ?? 'metodo non specificato';
    final importoStr = getImportoFormattato();

    return 'Pagato $importoStr il $data con $metodo';
  }
}
