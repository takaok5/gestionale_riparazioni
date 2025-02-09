import '../enums.dart';

extension StatoOrdineExtension on StatoOrdine {
  String get display {
    switch (this) {
      case StatoOrdine.inAttesa:
        return 'In Attesa';
      case StatoOrdine.confermato:
        return 'Confermato';
      case StatoOrdine.spedito:
        return 'Spedito';
      case StatoOrdine.consegnato:
        return 'Consegnato';
      case StatoOrdine.annullato:
        return 'Annullato';
      default:
        return toString().split('.').last;
    }
  }
}
