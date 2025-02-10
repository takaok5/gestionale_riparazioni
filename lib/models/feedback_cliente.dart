import 'package:meta/meta.dart';
import '../enums/enums.dart';

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

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'valutazione': valutazione,
      'commento': commento,
      'data': data.toIso8601String(),
      'riparazioneId': riparazioneId,
    };
  }

  factory FeedbackCliente.fromMap(Map<String, dynamic> map) {
    return FeedbackCliente(
      id: map['id'] as String,
      clienteId: map['clienteId'] as String,
      valutazione: map['valutazione'] as int,
      commento: map['commento'] as String?,
      data: DateTime.parse(map['data'] as String),
      riparazioneId: map['riparazioneId'] as String?,
    );
  }
}
