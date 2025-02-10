import 'enums/enums.dart';


class RiparazioneArchiviata {
  final String id;
  final String clienteId;
  final String dispositivo;
  final String problema;
  final DateTime dataIngresso;
  final DateTime dataUscita;
  final double costoRicambi;
  final double costoManodopera;
  final double totalePattuito;
  final String? note;
  final Map<String, dynamic>? dettagliRicambi;

  RiparazioneArchiviata({
    required this.id,
    required this.clienteId,
    required this.dispositivo,
    required this.problema,
    required this.dataIngresso,
    required this.dataUscita,
    required this.costoRicambi,
    required this.costoManodopera,
    required this.totalePattuito,
    this.note,
    this.dettagliRicambi,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'dispositivo': dispositivo,
      'problema': problema,
      'dataIngresso': dataIngresso.toIso8601String(),
      'dataUscita': dataUscita.toIso8601String(),
      'costoRicambi': costoRicambi,
      'costoManodopera': costoManodopera,
      'totalePattuito': totalePattuito,
      'note': note,
      'dettagliRicambi': dettagliRicambi,
    };
  }

  factory RiparazioneArchiviata.fromMap(Map<String, dynamic> map) {
    return RiparazioneArchiviata(
      id: map['id'] ?? '',
      clienteId: map['clienteId'] ?? '',
      dispositivo: map['dispositivo'] ?? '',
      problema: map['problema'] ?? '',
      dataIngresso: DateTime.parse(map['dataIngresso']),
      dataUscita: DateTime.parse(map['dataUscita']),
      costoRicambi: map['costoRicambi']?.toDouble() ?? 0.0,
      costoManodopera: map['costoManodopera']?.toDouble() ?? 0.0,
      totalePattuito: map['totalePattuito']?.toDouble() ?? 0.0,
      note: map['note'],
      dettagliRicambi: map['dettagliRicambi'],
    );
  }
}
