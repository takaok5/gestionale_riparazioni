import '../models/riparazione.dart';
import '../models/cliente.dart';
import '../models/ricambio.dart';
import 'enums/enums.dart';

class PriorityService {
  // Definizione dei pesi per il calcolo della priorità
  static const Map<String, int> _pesiTipoCliente = {
    'business': 5,
    'privato': 3,
    'convenzionato': 4,
  };

  static const Map<String, int> _pesiUrgenza = {
    'alta': 5,
    'media': 3,
    'bassa': 1,
  };

  // Calcola priorità su scala 1-100
  int calcolaPriorita({
    required Riparazione riparazione,
    required Cliente cliente,
    required List<Ricambio> ricambiNecessari,
    required int caricoLavoroAttuale,
  }) {
    int punteggio = 0;
    final now = DateTime.now();

    // Tempo di attesa (max 30 punti)
    final giorniAttesa = now.difference(riparazione.dataIngresso).inDays;
    punteggio += _calcolaPuntegggioAttesa(giorniAttesa);

    // Tipo cliente (max 20 punti)
    punteggio += _calcolaPunteggioCliente(cliente.tipo);

    // Urgenza dichiarata (max 20 punti)
    punteggio += _calcolaPunteggioUrgenza(riparazione.urgenza);

    // Disponibilità ricambi (max 15 punti)
    punteggio += _calcolaPunteggioRicambi(ricambiNecessari);

    // Carico di lavoro (max 15 punti)
    punteggio += _calcolaPunteggioCaricoLavoro(caricoLavoroAttuale);

    return punteggio;
  }

  int _calcolaPuntegggioAttesa(int giorniAttesa) {
    if (giorniAttesa <= 0) return 0;
    // Massimo 30 punti per l'attesa
    return (giorniAttesa * 2).clamp(0, 30);
  }

  int _calcolaPunteggioCliente(String tipoCliente) {
    // Converti il peso (1-5) in punteggio (max 20)
    final peso = _pesiTipoCliente[tipoCliente.toLowerCase()] ?? 3;
    return peso * 4;
  }

  int _calcolaPunteggioUrgenza(String livelloUrgenza) {
    // Converti il peso (1-5) in punteggio (max 20)
    final peso = _pesiUrgenza[livelloUrgenza.toLowerCase()] ?? 1;
    return peso * 4;
  }

  int _calcolaPunteggioRicambi(List<Ricambio> ricambi) {
    if (ricambi.isEmpty) return 15; // Nessun ricambio necessario

    // Verifica disponibilità ricambi
    int ricambiDisponibili = ricambi.where((r) => r.quantita > 0).length;
    double percentualeDisponibilita = ricambiDisponibili / ricambi.length;

    // Converti in punteggio (max 15)
    return (percentualeDisponibilita * 15).round();
  }

  int _calcolaPunteggioCaricoLavoro(int caricoAttuale) {
    // Supponiamo che 20 sia il carico massimo gestibile
    const caricoMassimo = 20;

    // Più il carico è alto, minore è la priorità
    double percentualeCarico =
        1 - (caricoAttuale / caricoMassimo).clamp(0.0, 1.0);
    return (percentualeCarico * 15).round();
  }

  // Restituisce suggerimenti per ottimizzare la priorità
  List<String> getSuggerimentiOttimizzazione({
    required Riparazione riparazione,
    required List<Ricambio> ricambiNecessari,
  }) {
    List<String> suggerimenti = [];

    // Verifica tempi di attesa
    final giorniAttesa =
        DateTime.now().difference(riparazione.dataIngresso).inDays;
    if (giorniAttesa > 7) {
      suggerimenti.add(
          'Riparazione in attesa da $giorniAttesa giorni. Considerare prioritizzazione.');
    }

    // Verifica ricambi
    for (var ricambio in ricambiNecessari) {
      if (ricambio.quantita <= ricambio.sogliaMinima) {
        suggerimenti
            .add('Scorte basse per ${ricambio.descrizione}. Ordinare ricambi.');
      }
    }

    // Verifica urgenza
    if (riparazione.urgenza == 'alta' && giorniAttesa > 3) {
      suggerimenti.add('Riparazione urgente in attesa da più di 3 giorni.');
    }

    return suggerimenti;
  }
}
