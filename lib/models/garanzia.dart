import 'package:meta/meta.dart';
import './base_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'enums\enums.dart';

/// Classe base per tutte le garanzie
@immutable
class Garanzia extends BaseModel {
  final String numero;
  final DateTime dataInizio;
  final DateTime dataFine;
  final String? note;
  final StatoGaranzia stato;
  final TipoGaranzia tipo;

  const Garanzia({
    required String id,
    required this.numero,
    required this.dataInizio,
    required this.dataFine,
    this.note,
    required this.stato,
    required this.tipo,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  // Getters comuni
  bool get attiva => stato == StatoGaranzia.attiva;
  DateTime get dataScadenza => dataFine;

  bool get isValid {
    final now = DateTime.now().toUtc();
    return stato == StatoGaranzia.attiva && dataFine.isAfter(now);
  }

  Duration get durata => dataFine.difference(dataInizio);

  Duration get rimanente {
    final now = DateTime.now().toUtc();
    return dataFine.difference(now);
  }

  bool get isScaduta {
    final now = DateTime.now().toUtc();
    return dataFine.isBefore(now);
  }

  bool get inScadenza {
    final giorni = rimanente.inDays;
    return attiva && giorni <= 30 && giorni > 0;
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'numero': numero,
      'dataInizio': Timestamp.fromDate(dataInizio),
      'dataFine': Timestamp.fromDate(dataFine),
      'note': note,
      'stato': stato.toString().split('.').last,
      'tipo': tipo.toString().split('.').last,
    };
  }
}

/// Garanzia interna per riparazioni
class GaranziaInterna extends Garanzia {
  final String riparazioneId;
  final String clienteId;
  final String dispositivo;
  final String? seriale;
  final List<String> componentiCoperti;
  final String? _motivazioneInvalidazione;
  final DateTime? _dataInvalidazione;

  const GaranziaInterna({
    required String id,
    required String numero,
    required this.riparazioneId,
    required this.clienteId,
    required this.dispositivo,
    required DateTime dataInizio,
    required DateTime dataFine,
    this.seriale,
    String? note,
    required StatoGaranzia stato,
    required this.componentiCoperti,
    String? motivazioneInvalidazione,
    DateTime? dataInvalidazione,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : _motivazioneInvalidazione = motivazioneInvalidazione,
        _dataInvalidazione = dataInvalidazione,
        super(
          id: id,
          numero: numero,
          dataInizio: dataInizio,
          dataFine: dataFine,
          note: note,
          stato: stato,
          tipo: TipoGaranzia.interna,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  String? get motivazioneInvalidazione => _motivazioneInvalidazione;
  DateTime? get dataInvalidazione => _dataInvalidazione;

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'riparazioneId': riparazioneId,
      'clienteId': clienteId,
      'dispositivo': dispositivo,
      'seriale': seriale,
      'componentiCoperti': componentiCoperti,
      'motivazioneInvalidazione': _motivazioneInvalidazione,
      'dataInvalidazione': _dataInvalidazione != null
          ? Timestamp.fromDate(_dataInvalidazione!)
          : null,
    };
  }

  factory GaranziaInterna.fromMap(Map<String, dynamic> map) {
    return GaranziaInterna(
      id: map['id'] as String,
      numero: map['numero'] as String,
      riparazioneId: map['riparazioneId'] as String,
      clienteId: map['clienteId'] as String,
      dispositivo: map['dispositivo'] as String,
      dataInizio: (map['dataInizio'] as Timestamp).toDate(),
      dataFine: (map['dataFine'] as Timestamp).toDate(),
      seriale: map['seriale'] as String?,
      note: map['note'] as String?,
      stato: StatoGaranzia.values.firstWhere(
        (e) => e.toString().split('.').last == map['stato'],
        orElse: () => StatoGaranzia.attiva,
      ),
      componentiCoperti: List<String>.from(map['componentiCoperti'] ?? []),
      motivazioneInvalidazione: map['motivazioneInvalidazione'] as String?,
      dataInvalidazione: map['dataInvalidazione'] != null
          ? (map['dataInvalidazione'] as Timestamp).toDate()
          : null,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }
}

/// Garanzia del fornitore
class GaranziaFornitore extends Garanzia {
  final String fornitore;

  const GaranziaFornitore({
    required String id,
    required String numero,
    required DateTime dataInizio,
    required DateTime dataFine,
    required this.fornitore,
    String? note,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          numero: numero,
          dataInizio: dataInizio,
          dataFine: dataFine,
          note: note,
          stato: StatoGaranzia.attiva,
          tipo: TipoGaranzia.fornitore,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'fornitore': fornitore,
    };
  }

  factory GaranziaFornitore.fromMap(Map<String, dynamic> map) {
    return GaranziaFornitore(
      id: map['id'] as String,
      numero: map['numero'] as String,
      dataInizio: (map['dataInizio'] as Timestamp).toDate(),
      dataFine: (map['dataFine'] as Timestamp).toDate(),
      fornitore: map['fornitore'] as String,
      note: map['note'] as String?,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }
}
