import '../models/riparazione.dart';
import '../models/cliente.dart';
import '../models/ricambio.dart';
import 'enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

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
    final now = AppDateUtils.getCurrentDateTime();

    // Tempo di attesa (max 30 punti)
    final giorniAttesa =
        AppDateUtils.daysBetween(riparazione.dataIngresso, now);
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

  Map<String, dynamic> calcolaPrioritaDettagliata({
    required Riparazione riparazione,
    required Cliente cliente,
    required List<Ricambio> ricambiNecessari,
    required int caricoLavoroAttuale,
  }) {
    final now = AppDateUtils.getCurrentDateTime();
    final giorniAttesa =
        AppDateUtils.daysBetween(riparazione.dataIngresso, now);

    final punteggioAttesa = _calcolaPuntegggioAttesa(giorniAttesa);
    final punteggioCliente = _calcolaPunteggioCliente(cliente.tipo);
    final punteggioUrgenza = _calcolaPunteggioUrgenza(riparazione.urgenza);
    final punteggioRicambi = _calcolaPunteggioRicambi(ricambiNecessari);
    final punteggioCaricoLavoro =
        _calcolaPunteggioCaricoLavoro(caricoLavoroAttuale);

    return {
      'prioritaTotale': punteggioAttesa +
          punteggioCliente +
          punteggioUrgenza +
          punteggioRicambi +
          punteggioCaricoLavoro,
      'dettagli': {
        'tempoAttesa': {
          'giorni': giorniAttesa,
          'punteggio': punteggioAttesa,
          'dataIngresso': AppDateUtils.formatDateTime(riparazione.dataIngresso),
          'tempoTrascorso':
              AppDateUtils.getTimeAgoString(riparazione.dataIngresso),
        },
        'cliente': {
          'tipo': cliente.tipo,
          'punteggio': punteggioCliente,
        },
        'urgenza': {
          'livello': riparazione.urgenza,
          'punteggio': punteggioUrgenza,
        },
        'ricambi': {
          'disponibilita':
              '${_calcolaPercentualeDisponibilitaRicambi(ricambiNecessari)}%',
          'punteggio': punteggioRicambi,
        },
        'caricoLavoro': {
          'attuale': caricoLavoroAttuale,
          'punteggio': punteggioCaricoLavoro,
        },
      },
      'timestampCalcolo': AppDateUtils.formatDateTime(now),
      'settimanaAnno': AppDateUtils.getWeekNumber(now),
    };
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
    return ((_calcolaPercentualeDisponibilitaRicambi(ricambi) / 100) * 15)
        .round();
  }

  double _calcolaPercentualeDisponibilitaRicambi(List<Ricambio> ricambi) {
    if (ricambi.isEmpty) return 100.0;
    int ricambiDisponibili = ricambi.where((r) => r.quantita > 0).length;
    return (ricambiDisponibili / ricambi.length) * 100;
  }

  int _calcolaPunteggioCaricoLavoro(int caricoAttuale) {
    const caricoMassimo = 20;
    // Più il carico è alto, minore è la priorità
    double percentualeCarico =
        1 - (caricoAttuale / caricoMassimo).clamp(0.0, 1.0);
    return (percentualeCarico * 15).round();
  }

  List<Map<String, dynamic>> getSuggerimentiOttimizzazione({
    required Riparazione riparazione,
    required List<Ricambio> ricambiNecessari,
  }) {
    List<Map<String, dynamic>> suggerimenti = [];
    final now = AppDateUtils.getCurrentDateTime();

    // Verifica tempi di attesa
    final giorniAttesa =
        AppDateUtils.daysBetween(riparazione.dataIngresso, now);
    if (giorniAttesa > 7) {
      suggerimenti.add({
        'tipo': 'attesa',
        'messaggio':
            'Riparazione in attesa da $giorniAttesa giorni. Considerare prioritizzazione.',
        'dettagli': {
          'giorniAttesa': giorniAttesa,
          'dataIngresso': AppDateUtils.formatDateTime(riparazione.dataIngresso),
          'tempoTrascorso':
              AppDateUtils.getTimeAgoString(riparazione.dataIngresso),
        },
        'priorita': 'alta',
      });
    }

    // Verifica ricambi
    for (var ricambio in ricambiNecessari) {
      if (ricambio.quantita <= ricambio.sogliaMinima) {
        suggerimenti.add({
          'tipo': 'ricambi',
          'messaggio':
              'Scorte basse per ${ricambio.descrizione}. Ordinare ricambi.',
          'dettagli': {
            'ricambio': ricambio.descrizione,
            'quantitaAttuale': ricambio.quantita,
            'sogliaMinima': ricambio.sogliaMinima,
            'ultimoOrdine': ricambio.ultimoOrdine != null
                ? AppDateUtils.formatDateTime(ricambio.ultimoOrdine!)
                : 'N/D',
          },
          'priorita': 'media',
        });
      }
    }

    // Verifica urgenza
    if (riparazione.urgenza == 'alta' && giorniAttesa > 3) {
      suggerimenti.add({
        'tipo': 'urgenza',
        'messaggio': 'Riparazione urgente in attesa da più di 3 giorni.',
        'dettagli': {
          'giorniAttesa': giorniAttesa,
          'dataIngresso': AppDateUtils.formatDateTime(riparazione.dataIngresso),
          'livelloUrgenza': riparazione.urgenza,
          'tempoTrascorso':
              AppDateUtils.getTimeAgoString(riparazione.dataIngresso),
        },
        'priorita': 'alta',
      });
    }

    return suggerimenti;
  }
}
