enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  console,
  altro;

  String get label {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer';
      case TipoDispositivo.console:
        return 'Console';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }
}
