import 'enums/enums.dart';

class Messaggio {
  final String id;
  final String mittente;
  final String destinatario;
  final String contenuto;
  final DateTime timestamp;
  final String? urlAllegato;
  final String? riparazioneId;
  final bool letto;

  Messaggio({
    required this.id,
    required this.mittente,
    required this.destinatario,
    required this.contenuto,
    required this.timestamp,
    this.urlAllegato,
    this.riparazioneId,
    this.letto = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'mittente': mittente,
      'destinatario': destinatario,
      'contenuto': contenuto,
      'timestamp': timestamp.toIso8601String(),
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
      timestamp: DateTime.parse(map['timestamp']),
      urlAllegato: map['urlAllegato'],
      riparazioneId: map['riparazioneId'],
      letto: map['letto'] ?? false,
    );
  }
}
