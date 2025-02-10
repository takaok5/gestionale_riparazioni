enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  laptop,
  desktop,
  console,
  smartwatch,
  auricolari,
  stampante,
  monitor,
  router,
  televisore,
  fotocamera,
  audioHifi,
  droni,
  altro;

  String get label {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'Smartphone';
      case TipoDispositivo.tablet:
        return 'Tablet';
      case TipoDispositivo.computer:
        return 'Computer';
      case TipoDispositivo.laptop:
        return 'Laptop';
      case TipoDispositivo.desktop:
        return 'Desktop';
      case TipoDispositivo.console:
        return 'Console';
      case TipoDispositivo.smartwatch:
        return 'Smartwatch';
      case TipoDispositivo.auricolari:
        return 'Auricolari';
      case TipoDispositivo.stampante:
        return 'Stampante';
      case TipoDispositivo.monitor:
        return 'Monitor';
      case TipoDispositivo.router:
        return 'Router';
      case TipoDispositivo.televisore:
        return 'Televisore';
      case TipoDispositivo.fotocamera:
        return 'Fotocamera';
      case TipoDispositivo.audioHifi:
        return 'Audio Hi-Fi';
      case TipoDispositivo.droni:
        return 'Droni';
      case TipoDispositivo.altro:
        return 'Altro';
    }
  }

  String get icon {
    switch (this) {
      case TipoDispositivo.smartphone:
        return 'smartphone';
      case TipoDispositivo.tablet:
        return 'tablet';
      case TipoDispositivo.computer:
        return 'computer';
      case TipoDispositivo.laptop:
        return 'laptop';
      case TipoDispositivo.desktop:
        return 'desktop';
      case TipoDispositivo.console:
        return 'videogame_asset';
      case TipoDispositivo.smartwatch:
        return 'watch';
      case TipoDispositivo.auricolari:
        return 'headphones';
      case TipoDispositivo.stampante:
        return 'print';
      case TipoDispositivo.monitor:
        return 'monitor';
      case TipoDispositivo.router:
        return 'router';
      case TipoDispositivo.televisore:
        return 'tv';
      case TipoDispositivo.fotocamera:
        return 'camera_alt';
      case TipoDispositivo.audioHifi:
        return 'speaker';
      case TipoDispositivo.droni:
        return 'airplanemode_active';
      case TipoDispositivo.altro:
        return 'devices_other';
    }
  }

  bool get requiresSerialNumber {
    switch (this) {
      case TipoDispositivo.smartphone:
      case TipoDispositivo.tablet:
      case TipoDispositivo.computer:
      case TipoDispositivo.laptop:
      case TipoDispositivo.desktop:
      case TipoDispositivo.console:
      case TipoDispositivo.fotocamera:
        return true;
      default:
        return false;
    }
  }
}
