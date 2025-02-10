import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class Messaggio {
  final String id;
  final String mittente;
  final String destinatario;
  final String contenuto;
  final DateTime timestamp;
  final String? urlAllegato;
  final String? riparazioneId;
  final bool letto;

  const Messaggio({
    required this.id,
    required this.mittente,
    required this.destinatario,
    required this.contenuto,
    required this.timestamp,
    this.urlAllegato,
    this.riparazioneId,
    this.letto = false,
  });

  // Getters per le informazioni temporali
  String get orario => AppDateUtils.formatTime(timestamp);
  String get data => AppDateUtils.formatDate(timestamp);
  String get dataOraCompleta => AppDateUtils.formatDateTime(timestamp);
  String get tempoInvio => AppDateUtils.timeAgo(timestamp);
  bool get isOggi => AppDateUtils.isToday(timestamp);
  bool get isIeri => AppDateUtils.isYesterday(timestamp);

  // Getter per lo stato del messaggio
  String get statoLettura => letto ? 'Letto' : 'Non letto';

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'mittente': mittente,
      'destinatario': destinatario,
      'contenuto': contenuto,
      'timestamp': AppDateUtils.toISOString(timestamp),
      'urlAllegato': urlAllegato,
      'riparazioneId': riparazioneId,
      'letto': letto,
    };
  }

  factory Messaggio.fromMap(Map<String, dynamic> map) {
    return Messaggio(
      id: map['id'],
      mittente: map['mittente'],
      destinatario: map['destinatario'],
      contenuto: map['contenuto'],
      timestamp:
          AppDateUtils.parseISOString(map['timestamp']) ?? DateTime.now(),
      urlAllegato: map['urlAllegato'],
      riparazioneId: map['riparazioneId'],
      letto: map['letto'] ?? false,
    );
  }

  // Metodo di utilità per creare una copia con modifiche
  Messaggio copyWith({
    String? id,
    String? mittente,
    String? destinatario,
    String? contenuto,
    DateTime? timestamp,
    String? urlAllegato,
    String? riparazioneId,
    bool? letto,
  }) {
    return Messaggio(
      id: id ?? this.id,
      mittente: mittente ?? this.mittente,
      destinatario: destinatario ?? this.destinatario,
      contenuto: contenuto ?? this.contenuto,
      timestamp: timestamp ?? this.timestamp,
      urlAllegato: urlAllegato ?? this.urlAllegato,
      riparazioneId: riparazioneId ?? this.riparazioneId,
      letto: letto ?? this.letto,
    );
  }
}
