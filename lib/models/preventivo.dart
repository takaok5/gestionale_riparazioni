import '../enums/enums.dart';
class Preventivo {
  final String id;
  final String riparazioneId;
  final String clienteId;
  final DateTime data;
  final double importo;
  final String descrizione;
  final bool accettato;
  final DateTime? dataAccettazione;
  final String? note;

  Preventivo({
    required this.id,
    required this.riparazioneId,
    required this.clienteId,
    required this.data,
    required this.importo,
    required this.descrizione,
    this.accettato = false,
    this.dataAccettazione,
    this.note,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'riparazioneId': riparazioneId,
      'clienteId': clienteId,
      'data': data.toIso8601String(),
      'importo': importo,
      'descrizione': descrizione,
      'accettato': accettato,
      'dataAccettazione': dataAccettazione?.toIso8601String(),
      'note': note,
    };
  }

  factory Preventivo.fromMap(Map<String, dynamic> map) {
    return Preventivo(
      id: map['id'] ?? '',
      riparazioneId: map['riparazioneId'] ?? '',
      clienteId: map['clienteId'] ?? '',
      data: DateTime.parse(map['data']),
      importo: map['importo']?.toDouble() ?? 0.0,
      descrizione: map['descrizione'] ?? '',
      accettato: map['accettato'] ?? false,
      dataAccettazione: map['dataAccettazione'] != null
          ? DateTime.parse(map['dataAccettazione'])
          : null,
      note: map['note'],
    );
  }
}
