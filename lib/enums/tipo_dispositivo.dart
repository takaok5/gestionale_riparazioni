enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  laptop,
  console,
  televisore,
  monitor,
  stampante,
  altro; // Note the semicolon here before the method

  /// Ottiene una descrizione leggibile del tipo
  String get descrizione {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer Desktop';
      case TipoDispositivo.laptop:
        return 'Computer Portatile';
      case TipoDispositivo.console:
        return 'Console';
      case TipoDispositivo.televisore:
        return 'Televisore';
      case TipoDispositivo.monitor:
        return 'Monitor';
      case TipoDispositivo.stampante:
        return 'Stampante';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }

  /// Controlla se il dispositivo è un computer (desktop o laptop)
  bool get isComputer =>
      this == TipoDispositivo.computer || this == TipoDispositivo.laptop;

  /// Controlla se il dispositivo è mobile
  bool get isMobile =>
      this == TipoDispositivo.smartphone || this == TipoDispositivo.tablet;
}
