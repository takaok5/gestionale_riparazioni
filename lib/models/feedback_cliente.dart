import 'package:meta/meta.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

@immutable
class FeedbackCliente {
  final String id;
  final String clienteId;
  final int valutazione;
  final String? commento;
  final DateTime data;
  final String? riparazioneId;

  const FeedbackCliente({
    required this.id,
    required this.clienteId,
    required this.valutazione,
    this.commento,
    required this.data,
    this.riparazioneId,
  }) : assert(valutazione >= 1 && valutazione <= 5,
            'La valutazione deve essere tra 1 e 5');

  // Getters per le date formattate
  String get dataFormattata => AppDateUtils.formatDate(data);
  String get dataOraFormattata => AppDateUtils.formatDateTime(data);
  String get tempoTrascorso => AppDateUtils.timeAgo(data);
  
  // Getter per la valutazione in formato stelline
  String get valutazioneStelle => '⭐' * valutazione;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'valutazione': valutazione,
      'commento': commento,
      'data': AppDateUtils.toISOString(data),
      'riparazioneId': riparazioneId,
    };
  }

  factory FeedbackCliente.fromMap(Map<String, dynamic> map) {
    return FeedbackCliente(
      id: map['id'] as String,
      clienteId: map['clienteId'] as String,
      valutazione: map['valutazione'] as int,
      commento: map['commento'] as String?,
      data: AppDateUtils.parseISOString(map['data']) ?? DateTime.now(),
      riparazioneId: map['riparazioneId'] as String?,
    );
  }

  // Metodo di utilità per creare una copia con modifiche
  FeedbackCliente copyWith({
    String? id,
    String? clienteId,
    int? valutazione,
    String? commento,
    DateTime? data,
    String? riparazioneId,
  }) {
    return FeedbackCliente(
      id: id ?? this.id,
      clienteId: clienteId ?? this.clienteId,
      valutazione: valutazione ?? this.valutazione,
      commento: commento ?? this.commento,
      data: data ?? this.data,
      riparazioneId: riparazioneId ?? this.riparazioneId,
    );
  }
}