import 'package:equatable/equatable.dart';
import '../utils/exceptions.dart';
import 'tipo_riparazione.dart';
import 'stato_riparazione.dart';
import 'tipo_dispositivo.dart';
import '../utils/imports.dart'; // Usa l'import centralizzato invece dei singoli file

enum PrioritaRiparazione { bassa, normale, alta, urgente }

class Riparazione extends Equatable {
  final String id;
  final String clienteId;
  final TipoDispositivo tipoDispositivo; // Cambiato da tipo a tipoDispositivo
  final TipoRiparazione tipoRiparazione; // Aggiunto nuovo campo
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

  const Riparazione({
    required this.id,
    required this.clienteId,
    required this.tipoDispositivo, // Aggiornato
    required this.tipoRiparazione, // Aggiunto
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
  })  : ricambiUtilizzati = ricambiUtilizzati ?? const [],
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Getters
  double get costoFinale => inGaranzia ? 0 : prezzo + costoRicambi;
  bool get isInLavorazione => stato == StatoRiparazione.inLavorazione;
  bool get isCompletata => stato == StatoRiparazione.completata;
  bool get isConsegnata => stato == StatoRiparazione.consegnata;
  Duration? get tempoLavorazione {
    if (dataUscita == null) return null;
    return dataUscita!.difference(dataIngresso);
  }

  // Metodi di Business Logic
  bool isInRitardo() {
    if (dataConsegnaPrevista == null || isConsegnata) return false;
    return DateTime.now().isAfter(dataConsegnaPrevista!);
  }

  bool pueEssereConsegnata() {
    return stato == StatoRiparazione.completata;
  }

  void validate() {
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
  }

  Map<String, dynamic> toMap() {
    return {
      'clienteId': clienteId,
      'tipoDispositivo': tipoDispositivo.name, // Aggiornato
      'tipoRiparazione': tipoRiparazione.name, // Aggiunto
      'tipoIntervento': tipoIntervento.toString(),
      'modelloDispositivo': modelloDispositivo,
      'descrizione': descrizione,
      'diagnosi': diagnosi,
      'stato': stato.toString(),
      'priorita': priorita.toString(),
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
        tipoIntervento: TipoRiparazione.values.firstWhere(
          // <-- Aggiunto
          (t) => t.toString() == map['tipoIntervento'],
          orElse: () => TipoRiparazione.standard,
        ),
        // .
        modelloDispositivo: map['modelloDispositivo'] as String,
        descrizione: map['descrizione'] as String,
        diagnosi: map['diagnosi'] as String?,
        stato: StatoRiparazione.values.firstWhere(
          (s) => s.toString() == map['stato'],
          orElse: () => StatoRiparazione.inAttesa,
        ),
        priorita: PrioritaRiparazione.values.firstWhere(
          (p) => p.toString() == map['priorita'],
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
    TipoRiparazione? tipo,
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
  }) {
    return Riparazione(
      id: id ?? this.id,
      clienteId: clienteId ?? this.clienteId,
      tipo: tipo ?? this.tipo,
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
      metadati: metadati != null
          ? Map.from(metadati)
          : this.metadati?.map((k, v) => MapEntry(k, v)),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }

  @override
  List<Object?> get props => [
        id,
        clienteId,
        tipo,
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
      ];

  @override
  String toString() => 'Riparazione(id: $id, tipo: $tipo, stato: $stato)';
}
