import 'package:equatable/equatable.dart';
import '../utils/exceptions.dart';
import 'enums/tipo_riparazione.dart';
import 'enums/stato_riparazione.dart';
import 'enums/tipo_dispositivo.dart';
import 'package:gestionale_riparazioni/utils/imports.dart';

enum PrioritaRiparazione {
  bassa,
  normale,
  alta,
  urgente;

  String get label {
    switch (this) {
      case PrioritaRiparazione.bassa:
        return 'Bassa';
      case PrioritaRiparazione.normale:
        return 'Normale';
      case PrioritaRiparazione.alta:
        return 'Alta';
      case PrioritaRiparazione.urgente:
        return 'Urgente';
    }
  }
}

class Riparazione extends Equatable {
  final String id;
  final String clienteId;
  final TipoDispositivo tipoDispositivo;
  final TipoRiparazione tipoRiparazione;
  final String modelloDispositivo;
  final String descrizione;
  final String? diagnosi;
  final StatoRiparazione stato;
  final PrioritaRiparazione priorita;
  final double prezzo;
  final double costoRicambi;
  final DateTime dataIngresso;
  final DateTime? appuntamento;
  final DateTime? dataConsegnaPrevista;
  final DateTime? dataUscita;
  final List<String> ricambiUtilizzati;
  final String? tecnicoAssegnato;
  final String? note;
  final bool inGaranzia;
  final String? numeroSeriale;
  final Map<String, dynamic>? metadati;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? dispositivo;
  final DateTime? dataApertura;
  final DateTime? dataChiusura;
  final String? tecnicoId;
  final double? costoTotale;

  const Riparazione({
    required this.id,
    required this.clienteId,
    required this.tipoDispositivo,
    required this.tipoRiparazione,
    required this.modelloDispositivo,
    required this.descrizione,
    this.diagnosi,
    required this.stato,
    this.priorita = PrioritaRiparazione.normale,
    required this.prezzo,
    required this.costoRicambi,
    required this.dataIngresso,
    this.appuntamento,
    this.dataConsegnaPrevista,
    this.dataUscita,
    List<String>? ricambiUtilizzati,
    this.tecnicoAssegnato,
    this.note,
    this.inGaranzia = false,
    this.numeroSeriale,
    this.metadati,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.dispositivo,
    this.dataApertura,
    this.dataChiusura,
    this.tecnicoId,
    this.costoTotale,
  })  : ricambiUtilizzati = ricambiUtilizzati ?? const [],
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Getters
  double get costoFinale =>
      inGaranzia ? 0 : (costoTotale ?? (prezzo + costoRicambi));
  bool get isInLavorazione => stato == StatoRiparazione.inLavorazione;
  bool get isCompletata => stato == StatoRiparazione.completata;
  bool get isConsegnata => stato == StatoRiparazione.consegnata;
  bool get isInAttesa => stato == StatoRiparazione.inAttesa;
  bool get isAnnullata => stato == StatoRiparazione.annullata;
  Duration? get tempoLavorazione {
    if (dataUscita == null) return null;
    return dataUscita!.difference(dataIngresso);
  }

  // Metodi di Business Logic
  bool isInRitardo() {
    if (dataConsegnaPrevista == null || isConsegnata || isAnnullata)
      return false;
    return DateTime.now().isAfter(dataConsegnaPrevista!);
  }

  bool puoEssereConsegnata() {
    return stato == StatoRiparazione.completata;
  }

  void validate() {
    if (id.isEmpty) {
      throw ValidationException('ID riparazione non può essere vuoto');
    }
    if (clienteId.isEmpty) {
      throw ValidationException('ID cliente non può essere vuoto');
    }
    if (modelloDispositivo.isEmpty) {
      throw ValidationException('Modello dispositivo non può essere vuoto');
    }
    if (descrizione.isEmpty) {
      throw ValidationException('Descrizione non può essere vuota');
    }
    if (prezzo < 0) {
      throw ValidationException('Il prezzo non può essere negativo');
    }
    if (costoRicambi < 0) {
      throw ValidationException('Il costo dei ricambi non può essere negativo');
    }
    if (appuntamento != null && appuntamento!.isBefore(dataIngresso)) {
      throw ValidationException(
          'La data dell\'appuntamento non può essere precedente alla data di ingresso');
    }
    if (dataUscita != null && dataUscita!.isBefore(dataIngresso)) {
      throw ValidationException(
          'La data di uscita non può essere precedente alla data di ingresso');
    }
    if (dataChiusura != null &&
        dataApertura != null &&
        dataChiusura!.isBefore(dataApertura!)) {
      throw ValidationException(
          'La data di chiusura non può essere precedente alla data di apertura');
    }
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'tipoDispositivo': tipoDispositivo.name,
      'tipoRiparazione': tipoRiparazione.name,
      'modelloDispositivo': modelloDispositivo,
      'descrizione': descrizione,
      'diagnosi': diagnosi,
      'stato': stato.name,
      'priorita': priorita.name,
      'prezzo': prezzo,
      'costoRicambi': costoRicambi,
      'dataIngresso': dataIngresso.toIso8601String(),
      'appuntamento': appuntamento?.toIso8601String(),
      'dataConsegnaPrevista': dataConsegnaPrevista?.toIso8601String(),
      'dataUscita': dataUscita?.toIso8601String(),
      'ricambiUtilizzati': ricambiUtilizzati,
      'tecnicoAssegnato': tecnicoAssegnato,
      'note': note,
      'inGaranzia': inGaranzia,
      'numeroSeriale': numeroSeriale,
      'metadati': metadati,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'dispositivo': dispositivo,
      'dataApertura': dataApertura?.toIso8601String(),
      'dataChiusura': dataChiusura?.toIso8601String(),
      'tecnicoId': tecnicoId,
      'costoTotale': costoTotale,
    };
  }

  factory Riparazione.fromMap(Map<String, dynamic> map) {
    try {
      return Riparazione(
        id: map['id'] as String,
        clienteId: map['clienteId'] as String,
        tipoDispositivo: TipoDispositivo.values.firstWhere(
          (t) => t.name == map['tipoDispositivo'],
          orElse: () => TipoDispositivo.altro,
        ),
        tipoRiparazione: TipoRiparazione.values.firstWhere(
          (t) => t.name == map['tipoRiparazione'],
          orElse: () => TipoRiparazione.standard,
        ),
        modelloDispositivo: map['modelloDispositivo'] as String,
        descrizione: map['descrizione'] as String,
        diagnosi: map['diagnosi'] as String?,
        stato: StatoRiparazione.values.firstWhere(
          (s) => s.name == map['stato'],
          orElse: () => StatoRiparazione.inAttesa,
        ),
        priorita: PrioritaRiparazione.values.firstWhere(
          (p) => p.name == map['priorita'],
          orElse: () => PrioritaRiparazione.normale,
        ),
        prezzo: (map['prezzo'] as num).toDouble(),
        costoRicambi: (map['costoRicambi'] as num).toDouble(),
        dataIngresso: DateTime.parse(map['dataIngresso'] as String),
        appuntamento: map['appuntamento'] != null
            ? DateTime.parse(map['appuntamento'] as String)
            : null,
        dataConsegnaPrevista: map['dataConsegnaPrevista'] != null
            ? DateTime.parse(map['dataConsegnaPrevista'] as String)
            : null,
        dataUscita: map['dataUscita'] != null
            ? DateTime.parse(map['dataUscita'] as String)
            : null,
        ricambiUtilizzati: map['ricambiUtilizzati'] != null
            ? List<String>.from(map['ricambiUtilizzati'])
            : null,
        tecnicoAssegnato: map['tecnicoAssegnato'] as String?,
        note: map['note'] as String?,
        inGaranzia: map['inGaranzia'] as bool? ?? false,
        numeroSeriale: map['numeroSeriale'] as String?,
        metadati: map['metadati'] as Map<String, dynamic>?,
        createdAt: DateTime.parse(map['createdAt'] as String),
        updatedAt: DateTime.parse(map['updatedAt'] as String),
        dispositivo: map['dispositivo'] as String?,
        dataApertura: map['dataApertura'] != null
            ? DateTime.parse(map['dataApertura'] as String)
            : null,
        dataChiusura: map['dataChiusura'] != null
            ? DateTime.parse(map['dataChiusura'] as String)
            : null,
        tecnicoId: map['tecnicoId'] as String?,
        costoTotale: map['costoTotale']?.toDouble(),
      );
    } catch (e) {
      throw ValidationException(
        'Errore nella conversione della riparazione',
        details: e.toString(),
      );
    }
  }

  Riparazione copyWith({
    String? id,
    String? clienteId,
    TipoDispositivo? tipoDispositivo,
    TipoRiparazione? tipoRiparazione,
    String? modelloDispositivo,
    String? descrizione,
    String? diagnosi,
    StatoRiparazione? stato,
    PrioritaRiparazione? priorita,
    double? prezzo,
    double? costoRicambi,
    DateTime? dataIngresso,
    DateTime? appuntamento,
    DateTime? dataConsegnaPrevista,
    DateTime? dataUscita,
    List<String>? ricambiUtilizzati,
    String? tecnicoAssegnato,
    String? note,
    bool? inGaranzia,
    String? numeroSeriale,
    Map<String, dynamic>? metadati,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? dispositivo,
    DateTime? dataApertura,
    DateTime? dataChiusura,
    String? tecnicoId,
    double? costoTotale,
  }) {
    return Riparazione(
      id: id ?? this.id,
      clienteId: clienteId ?? this.clienteId,
      tipoDispositivo: tipoDispositivo ?? this.tipoDispositivo,
      tipoRiparazione: tipoRiparazione ?? this.tipoRiparazione,
      modelloDispositivo: modelloDispositivo ?? this.modelloDispositivo,
      descrizione: descrizione ?? this.descrizione,
      diagnosi: diagnosi ?? this.diagnosi,
      stato: stato ?? this.stato,
      priorita: priorita ?? this.priorita,
      prezzo: prezzo ?? this.prezzo,
      costoRicambi: costoRicambi ?? this.costoRicambi,
      dataIngresso: dataIngresso ?? this.dataIngresso,
      appuntamento: appuntamento ?? this.appuntamento,
      dataConsegnaPrevista: dataConsegnaPrevista ?? this.dataConsegnaPrevista,
      dataUscita: dataUscita ?? this.dataUscita,
      ricambiUtilizzati: ricambiUtilizzati ?? List.from(this.ricambiUtilizzati),
      tecnicoAssegnato: tecnicoAssegnato ?? this.tecnicoAssegnato,
      note: note ?? this.note,
      inGaranzia: inGaranzia ?? this.inGaranzia,
      numeroSeriale: numeroSeriale ?? this.numeroSeriale,
      metadati: metadati ?? Map.from(this.metadati ?? {}),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      dispositivo: dispositivo ?? this.dispositivo,
      dataApertura: dataApertura ?? this.dataApertura,
      dataChiusura: dataChiusura ?? this.dataChiusura,
      tecnicoId: tecnicoId ?? this.tecnicoId,
      costoTotale: costoTotale ?? this.costoTotale,
    );
  }

  @override
  List<Object?> get props => [
        id,
        clienteId,
        tipoDispositivo,
        tipoRiparazione,
        modelloDispositivo,
        descrizione,
        diagnosi,
        stato,
        priorita,
        prezzo,
        costoRicambi,
        dataIngresso,
        appuntamento,
        dataConsegnaPrevista,
        dataUscita,
        ricambiUtilizzati,
        tecnicoAssegnato,
        note,
        inGaranzia,
        numeroSeriale,
        metadati,
        createdAt,
        updatedAt,
        dispositivo,
        dataApertura,
        dataChiusura,
        tecnicoId,
        costoTotale,
      ];

  @override
  String toString() =>
      'Riparazione(id: $id, tipo: $tipoDispositivo, stato: $stato)';
}
