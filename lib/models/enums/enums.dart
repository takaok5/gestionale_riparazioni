// Stato del dispositivo
enum StatoDispositivo {
  nuovo,
  usato,
  danneggiato,
  nonFunzionante,
  inRiparazione,
  riparato,
  daSmaltire;

  String get label {
    switch (this) {
      case StatoDispositivo.nuovo:
        return 'Nuovo';
      case StatoDispositivo.usato:
        return 'Usato';
      case StatoDispositivo.danneggiato:
        return 'Danneggiato';
      case StatoDispositivo.nonFunzionante:
        return 'Non Funzionante';
      case StatoDispositivo.inRiparazione:
        return 'In Riparazione';
      case StatoDispositivo.riparato:
        return 'Riparato';
      case StatoDispositivo.daSmaltire:
        return 'Da Smaltire';
    }
  }
}

// Stato dell'accessorio
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

// Tipo di riparazione
enum TipoRiparazione {
  smartphone,
  tablet,
  computer,
  console,
  altroDispositivo;

  String get displayName {
    switch (this) {
      case TipoRiparazione.smartphone:
        return 'Smartphone';
      case TipoRiparazione.tablet:
        return 'Tablet';
      case TipoRiparazione.computer:
        return 'Computer';
      case TipoRiparazione.console:
        return 'Console';
      case TipoRiparazione.altroDispositivo:
        return 'Altro Dispositivo';
    }
  }
}

// Priorità della riparazione
enum PrioritaRiparazione {
  bassa,
  media,
  alta,
  urgente;

  String get label {
    switch (this) {
      case PrioritaRiparazione.bassa:
        return 'Bassa';
      case PrioritaRiparazione.media:
        return 'Media';
      case PrioritaRiparazione.alta:
        return 'Alta';
      case PrioritaRiparazione.urgente:
        return 'Urgente';
    }
  }
}

// Stato del cliente
enum StatoCliente {
  attivo,
  inattivo,
  sospeso,
  cancellato;

  String get label {
    switch (this) {
      case StatoCliente.attivo:
        return 'Attivo';
      case StatoCliente.inattivo:
        return 'Inattivo';
      case StatoCliente.sospeso:
        return 'Sospeso';
      case StatoCliente.cancellato:
        return 'Cancellato';
    }
  }
}

// Stato del tecnico
enum StatoTecnico {
  attivo,
  inattivo,
  ferie,
  malattia,
  sospeso;

  String get label {
    switch (this) {
      case StatoTecnico.attivo:
        return 'Attivo';
      case StatoTecnico.inattivo:
        return 'Inattivo';
      case StatoTecnico.ferie:
        return 'In Ferie';
      case StatoTecnico.malattia:
        return 'In Malattia';
      case StatoTecnico.sospeso:
        return 'Sospeso';
    }
  }
}

// Livello di certificazione
enum LivelloCertificazione {
  junior,
  intermediate,
  senior,
  expert;

  String get label {
    switch (this) {
      case LivelloCertificazione.junior:
        return 'Junior';
      case LivelloCertificazione.intermediate:
        return 'Intermediate';
      case LivelloCertificazione.senior:
        return 'Senior';
      case LivelloCertificazione.expert:
        return 'Expert';
    }
  }
}

// Stato dell'ordine
enum StatoOrdine {
  inAttesa,
  inLavorazione,
  completato,
  annullato,
  inSospeso;

  String get label {
    switch (this) {
      case StatoOrdine.inAttesa:
        return 'In Attesa';
      case StatoOrdine.inLavorazione:
        return 'In Lavorazione';
      case StatoOrdine.completato:
        return 'Completato';
      case StatoOrdine.annullato:
        return 'Annullato';
      case StatoOrdine.inSospeso:
        return 'In Sospeso';
    }
  }
}