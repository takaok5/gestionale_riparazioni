enum StatoOrdine {
  inAttesa,
  confermato,
  spedito,
  consegnato,
  annullato;

  String get display {
    switch (this) {
      case StatoOrdine.inAttesa:
        return 'In attesa';
      case StatoOrdine.confermato:
        return 'Confermato';
      case StatoOrdine.spedito:
        return 'Spedito';
      case StatoOrdine.consegnato:
        return 'Consegnato';
      case StatoOrdine.annullato:
        return 'Annullato';
    }
  }

  Color get color {
    switch (this) {
      case StatoOrdine.inAttesa:
        return Colors.orange;
      case StatoOrdine.confermato:
        return Colors.blue;
      case StatoOrdine.spedito:
        return Colors.purple;
      case StatoOrdine.consegnato:
        return Colors.green;
      case StatoOrdine.annullato:
        return Colors.red;
    }
  }
}
