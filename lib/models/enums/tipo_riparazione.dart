enum TipoRiparazione {
  standard,
  urgente,
  garanzia,
  preventivo,
  diagnostica,
  assistenza,
  manutenzione,
  altro;

  String get label {
    switch (this) {
      case TipoRiparazione.standard:
        return 'Standard';
      case TipoRiparazione.urgente:
        return 'Urgente';
      case TipoRiparazione.garanzia:
        return 'In Garanzia';
      case TipoRiparazione.preventivo:
        return 'Preventivo';
      case TipoRiparazione.diagnostica:
        return 'Diagnostica';
      case TipoRiparazione.assistenza:
        return 'Assistenza';
      case TipoRiparazione.manutenzione:
        return 'Manutenzione';
      case TipoRiparazione.altro:
        return 'Altro';
    }
  }
}
