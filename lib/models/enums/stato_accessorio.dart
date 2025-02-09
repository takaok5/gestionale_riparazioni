enum StatoAccessorio {
  presente,
  assente,
  danneggiato;

  String get label {
    switch (this) {
      case StatoAccessorio.presente:
        return 'Presente';
      case StatoAccessorio.assente:
        return 'Assente';
      case StatoAccessorio.danneggiato:
        return 'Danneggiato';
    }
  }
}
