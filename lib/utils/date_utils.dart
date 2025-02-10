import 'package:timeago/timeago.dart' as timeago;
import 'package:intl/intl.dart';

/// Utility class per la gestione delle date nell'applicazione
/// Rinominato da DateUtils a AppDateUtils per evitare conflitti con Flutter Material DateUtils
class AppDateUtils {
  // Formatter statici riutilizzabili
  static final DateFormat _dateFormatter = DateFormat('dd/MM/yyyy');
  static final DateFormat _dateTimeFormatter = DateFormat('dd/MM/yyyy HH:mm');
  static final DateFormat _timeFormatter = DateFormat('HH:mm');
  static final DateFormat _isoFormatter = DateFormat('yyyy-MM-dd\'T\'HH:mm:ss');

  /// Restituisce l'inizio del giorno (00:00:00)
  static DateTime startOfDay(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  /// Restituisce la fine del giorno (23:59:59.999)
  static DateTime endOfDay(DateTime date) {
    return DateTime(date.year, date.month, date.day, 23, 59, 59, 999);
  }

  /// Restituisce l'inizio del mese
  static DateTime startOfMonth(DateTime date) {
    return DateTime(date.year, date.month, 1);
  }

  /// Restituisce la fine del mese
  static DateTime endOfMonth(DateTime date) {
    return DateTime(date.year, date.month + 1, 0, 23, 59, 59, 999);
  }

  /// Formatta una data in formato relativo (es: "2 ore fa", "ieri", ecc.)
  static String timeAgo(DateTime date) {
    return timeago.format(date, locale: 'it');
  }

  /// Restituisce una lista di date tra start e end (inclusi)
  static List<DateTime> getDaysInRange(DateTime start, DateTime end) {
    final days = <DateTime>[];
    var current = startOfDay(start);
    final endDate = startOfDay(end);

    while (current.isBefore(endDate) || isSameDay(current, endDate)) {
      days.add(current);
      current = current.add(const Duration(days: 1));
    }
    return days;
  }

  /// Verifica se due date sono lo stesso giorno
  static bool isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }

  /// Formatta una data in formato dd/MM/yyyy
  static String formatDate(DateTime date) {
    return _dateFormatter.format(date);
  }

  /// Formatta una data e ora in formato dd/MM/yyyy HH:mm
  static String formatDateTime(DateTime date) {
    return _dateTimeFormatter.format(date);
  }

  /// Formatta un'ora in formato HH:mm
  static String formatTime(DateTime date) {
    return _timeFormatter.format(date);
  }

  /// Formatta una durata in formato leggibile (es: "2g 3h" o "45min")
  static String formatDuration(Duration duration) {
    final days = duration.inDays;
    final hours = duration.inHours % 24;
    final minutes = duration.inMinutes % 60;

    if (days > 0) {
      return '$days g ${hours}h';
    } else if (hours > 0) {
      return '$hours h ${minutes}m';
    } else {
      return '$minutes min';
    }
  }

  /// Nuove funzioni utili per il gestionale riparazioni

  /// Calcola la data di scadenza della garanzia
  static DateTime calcolaScadenzaGaranzia(
      DateTime dataInizio, int mesiGaranzia) {
    return DateTime(
      dataInizio.year,
      dataInizio.month + mesiGaranzia,
      dataInizio.day,
      dataInizio.hour,
      dataInizio.minute,
      dataInizio.second,
    );
  }

  /// Verifica se una garanzia è scaduta
  static bool isGaranziaScaduta(DateTime dataScadenza) {
    return DateTime.now().isAfter(dataScadenza);
  }

  /// Calcola i giorni rimanenti alla scadenza della garanzia
  static int giorniAllaScadenza(DateTime dataScadenza) {
    final now = DateTime.now();
    return dataScadenza.difference(now).inDays;
  }

  /// Formatta una data in formato ISO8601 per il database
  static String toISOString(DateTime date) {
    return _isoFormatter.format(date);
  }

  /// Parse una data da stringa ISO8601
  static DateTime? parseISOString(String? date) {
    if (date == null) return null;
    try {
      return DateTime.parse(date);
    } catch (e) {
      return null;
    }
  }

  /// Verifica se una data è nel futuro
  static bool isFuture(DateTime date) {
    return date.isAfter(DateTime.now());
  }

  /// Verifica se una data è nel passato
  static bool isPast(DateTime date) {
    return date.isBefore(DateTime.now());
  }

  /// Calcola il tempo stimato di completamento di una riparazione
  static DateTime stimaCompletamentoRiparazione(
    DateTime dataInizio,
    Duration tempoStimato, {
    bool soloGiorniLavorativi = true,
  }) {
    if (!soloGiorniLavorativi) {
      return dataInizio.add(tempoStimato);
    }

    var dataStimata = dataInizio;
    var giorniLavorativiRimanenti = tempoStimato.inDays;

    while (giorniLavorativiRimanenti > 0) {
      dataStimata = dataStimata.add(const Duration(days: 1));
      // Salta sabato (6) e domenica (7)
      if (dataStimata.weekday < 6) {
        giorniLavorativiRimanenti--;
      }
    }

    return dataStimata;
  }
}
