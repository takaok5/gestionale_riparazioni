import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

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

  // Getters per la formattazione delle date
  String get dataFormatted => AppDateUtils.formatDate(data);
  String get dataOraFormatted => AppDateUtils.formatDateTime(data);
  String get dataAccettazioneFormatted => dataAccettazione != null
      ? AppDateUtils.formatDateTime(dataAccettazione!)
      : 'Non accettato';
  String get dataRelativa => AppDateUtils.timeAgo(data);

  bool get isScaduto => AppDateUtils.isPast(data.add(const Duration(days: 30)));
  bool get isRecente => !AppDateUtils.isPast(data.add(const Duration(days: 7)));

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'riparazioneId': riparazioneId,
      'clienteId': clienteId,
      'data': AppDateUtils.toISOString(data),
      'importo': importo,
      'descrizione': descrizione,
      'accettato': accettato,
      'dataAccettazione': dataAccettazione != null
          ? AppDateUtils.toISOString(dataAccettazione!)
          : null,
      'note': note,
    };
  }

  factory Preventivo.fromMap(Map<String, dynamic> map) {
    return Preventivo(
      id: map['id'] ?? '',
      riparazioneId: map['riparazioneId'] ?? '',
      clienteId: map['clienteId'] ?? '',
      data: AppDateUtils.parseISOString(map['data']) ?? DateTime.now(),
      importo: map['importo']?.toDouble() ?? 0.0,
      descrizione: map['descrizione'] ?? '',
      accettato: map['accettato'] ?? false,
      dataAccettazione: AppDateUtils.parseISOString(map['dataAccettazione']),
      note: map['note'],
    );
  }

  // Copia con modifiche
  Preventivo copyWith({
    String? id,
    String? riparazioneId,
    String? clienteId,
    DateTime? data,
    double? importo,
    String? descrizione,
    bool? accettato,
    DateTime? dataAccettazione,
    String? note,
  }) {
    return Preventivo(
      id: id ?? this.id,
      riparazioneId: riparazioneId ?? this.riparazioneId,
      clienteId: clienteId ?? this.clienteId,
      data: data ?? this.data,
      importo: importo ?? this.importo,
      descrizione: descrizione ?? this.descrizione,
      accettato: accettato ?? this.accettato,
      dataAccettazione: dataAccettazione ?? this.dataAccettazione,
      note: note ?? this.note,
    );
  }
}
