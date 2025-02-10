enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  altro
}

extension TipoDispositivoExtension on TipoDispositivo {
  String get display {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }
}