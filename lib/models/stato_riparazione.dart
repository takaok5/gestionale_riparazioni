import 'package:flutter/material.dart';

enum StatoRiparazione {
  nuovaRichiesta(
    display: 'Nuova richiesta',
    color: Colors.purple,
    icon: Icons.fiber_new,
    canTransitionTo: {inAttesa, annullata},
  ),
  inAttesa(
    display: 'In attesa',
    color: Colors.orange,
    icon: Icons.schedule,
    canTransitionTo: {inLavorazione, annullata},
  ),
  inLavorazione(
    display: 'In lavorazione',
    color: Colors.blue,
    icon: Icons.build,
    canTransitionTo: {inAttesaRicambi, completata, annullata},
  ),
  inAttesaRicambi(
    display: 'In attesa ricambi',
    color: Colors.amber,
    icon: Icons.inventory,
    canTransitionTo: {inLavorazione, annullata},
  ),
  completata(
    display: 'Completata',
    color: Colors.green,
    icon: Icons.check_circle,
    canTransitionTo: {consegnata, inLavorazione},
  ),
  consegnata(
    display: 'Consegnata',
    color: Colors.teal,
    icon: Icons.delivery_dining,
    canTransitionTo: {},
  ),
  annullata(
    display: 'Annullata',
    color: Colors.red,
    icon: Icons.cancel,
    canTransitionTo: {},
  );

  const StatoRiparazione({
    required this.display,
    required this.color,
    required this.icon,
    required this.canTransitionTo,
  });

  final String display;
  final Color color;
  final IconData icon;
  final Set<StatoRiparazione> canTransitionTo;

  bool get isTerminal => canTransitionTo.isEmpty;
  bool get isInProgress => this == inLavorazione || this == inAttesaRicambi;
  bool get needsAction => this == nuovaRichiesta || this == inAttesa;

  /// Verifica se è possibile la transizione allo stato specificato
  bool canTransitionToState(StatoRiparazione newState) {
    return canTransitionTo.contains(newState);
  }

  /// Restituisce tutti gli stati possibili dopo lo stato corrente
  Set<StatoRiparazione> get nextPossibleStates => canTransitionTo;

  /// Controlla se lo stato è definitivo (non può più essere modificato)
  bool get isFinal => this == consegnata || this == annullata;

  /// Restituisce la priorità dello stato per l'ordinamento
  int get priority {
    switch (this) {
      case StatoRiparazione.nuovaRichiesta:
        return 0;
      case StatoRiparazione.inAttesa:
        return 1;
      case StatoRiparazione.inLavorazione:
        return 2;
      case StatoRiparazione.inAttesaRicambi:
        return 3;
      case StatoRiparazione.completata:
        return 4;
      case StatoRiparazione.consegnata:
        return 5;
      case StatoRiparazione.annullata:
        return 6;
    }
  }

  /// Restituisce il colore di sfondo più chiaro per l'UI
  Color get backgroundColor => color.withOpacity(0.1);

  /// Restituisce il colore del testo per l'UI
  Color get textColor =>
      color.computeLuminance() > 0.5 ? Colors.black : Colors.white;

  static StatoRiparazione fromString(String value) {
    try {
      return StatoRiparazione.values.firstWhere(
        (stato) =>
            stato.toString().split('.').last.toLowerCase() ==
            value.toLowerCase(),
      );
    } catch (e) {
      throw ArgumentError('Stato riparazione non valido: $value');
    }
  }

  @override
  String toString() => display;
}

/// Extension methods per le liste di StatoRiparazione
extension StatoRiparazioneListExtension on List<StatoRiparazione> {
  /// Ordina gli stati per priorità
  List<StatoRiparazione> sortByPriority() {
    sort((a, b) => a.priority.compareTo(b.priority));
    return this;
  }

  /// Filtra gli stati attivi (non terminali)
  List<StatoRiparazione> get active =>
      where((stato) => !stato.isTerminal).toList();

  /// Filtra gli stati che richiedono azione
  List<StatoRiparazione> get needingAction =>
      where((stato) => stato.needsAction).toList();
}
