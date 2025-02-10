enum StatoAccessorio {
  presente,
  assente,
  danneggiato,
  sostituito;

  String get label {
    switch (this) {
      case StatoAccessorio.presente:
        return 'Presente';
      case StatoAccessorio.assente:
        return 'Assente';
      case StatoAccessorio.danneggiato:
        return 'Danneggiato';
      case StatoAccessorio.sostituito:
        return 'Sostituito';
    }
  }
}
