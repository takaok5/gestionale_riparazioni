import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/imports.dart';
import 'enums/stato_riparazione.dart';
import 'enums/tipo_dispositivo.dart';
import 'enums/tipo_riparazione.dart';
import 'enums/priorita_riparazione.dart';
import 'dispositivo.dart';
import 'cliente.dart';
import 'tecnico.dart';
import 'ricambio.dart';
import 'base_model.dart';

class Riparazione extends BaseModel {
  final String id;
  final Cliente cliente;
  final Dispositivo dispositivo;
  final String descrizioneProblema;
  final String? noteInterne;
  final DateTime dataRicezione;
  final DateTime? dataCompletamento;
  final DateTime? dataConsegna;
  final StatoRiparazione stato;
  final TipoRiparazione tipoRiparazione;
  final PrioritaRiparazione priorita;
  final Tecnico? tecnicoAssegnato;
  final double? preventivo;
  final double? costoFinale;
  final List<Ricambio>? ricambiUtilizzati;
  final bool inGaranzia;
  final String? numeroGaranzia;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Riparazione({
    required this.id,
    required this.cliente,
    required this.dispositivo,
    required this.descrizioneProblema,
    this.noteInterne,
    required this.dataRicezione,
    this.dataCompletamento,
    this.dataConsegna,
    required this.stato,
    required this.tipoRiparazione,
    required this.priorita,
    this.tecnicoAssegnato,
    this.preventivo,
    this.costoFinale,
    this.ricambiUtilizzati,
    required this.inGaranzia,
    this.numeroGaranzia,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': cliente.id,
      'dispositivo': dispositivo.toMap(),
      'descrizioneProblema': descrizioneProblema,
      'noteInterne': noteInterne,
      'dataRicezione': Timestamp.fromDate(dataRicezione),
      'dataCompletamento': dataCompletamento != null
          ? Timestamp.fromDate(dataCompletamento!)
          : null,
      'dataConsegna':
          dataConsegna != null ? Timestamp.fromDate(dataConsegna!) : null,
      'stato': stato.name,
      'tipoRiparazione': tipoRiparazione.name,
      'priorita': priorita.name,
      'tecnicoAssegnatoId': tecnicoAssegnato?.id,
      'preventivo': preventivo,
      'costoFinale': costoFinale,
      'ricambiUtilizzati': ricambiUtilizzati?.map((r) => r.toMap()).toList(),
      'inGaranzia': inGaranzia,
      'numeroGaranzia': numeroGaranzia,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  static Riparazione fromMap(
    Map<String, dynamic> map, {
    required Cliente cliente,
    Tecnico? tecnico,
    List<Ricambio>? ricambi,
  }) {
    return Riparazione(
      id: map['id'] ?? '',
      cliente: cliente,
      dispositivo:
          Dispositivo.fromMap(map['dispositivo'] as Map<String, dynamic>),
      descrizioneProblema: map['descrizioneProblema'] ?? '',
      noteInterne: map['noteInterne'],
      dataRicezione: (map['dataRicezione'] as Timestamp).toDate(),
      dataCompletamento: map['dataCompletamento'] != null
          ? (map['dataCompletamento'] as Timestamp).toDate()
          : null,
      dataConsegna: map['dataConsegna'] != null
          ? (map['dataConsegna'] as Timestamp).toDate()
          : null,
      stato: StatoRiparazione.values.firstWhere(
        (e) => e.name == map['stato'],
        orElse: () => StatoRiparazione.inAttesa,
      ),
      tipoRiparazione: TipoRiparazione.values.firstWhere(
        (e) => e.name == map['tipoRiparazione'],
        orElse: () => TipoRiparazione.riparazione,
      ),
      priorita: PrioritaRiparazione.values.firstWhere(
        (e) => e.name == map['priorita'],
        orElse: () => PrioritaRiparazione.normale,
      ),
      tecnicoAssegnato: tecnico,
      preventivo: map['preventivo']?.toDouble(),
      costoFinale: map['costoFinale']?.toDouble(),
      ricambiUtilizzati: ricambi,
      inGaranzia: map['inGaranzia'] ?? false,
      numeroGaranzia: map['numeroGaranzia'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Riparazione copyWith({
    String? id,
    Cliente? cliente,
    Dispositivo? dispositivo,
    String? descrizioneProblema,
    String? noteInterne,
    DateTime? dataRicezione,
    DateTime? dataCompletamento,
    DateTime? dataConsegna,
    StatoRiparazione? stato,
    TipoRiparazione? tipoRiparazione,
    PrioritaRiparazione? priorita,
    Tecnico? tecnicoAssegnato,
    double? preventivo,
    double? costoFinale,
    List<Ricambio>? ricambiUtilizzati,
    bool? inGaranzia,
    String? numeroGaranzia,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Riparazione(
      id: id ?? this.id,
      cliente: cliente ?? this.cliente,
      dispositivo: dispositivo ?? this.dispositivo,
      descrizioneProblema: descrizioneProblema ?? this.descrizioneProblema,
      noteInterne: noteInterne ?? this.noteInterne,
      dataRicezione: dataRicezione ?? this.dataRicezione,
      dataCompletamento: dataCompletamento ?? this.dataCompletamento,
      dataConsegna: dataConsegna ?? this.dataConsegna,
      stato: stato ?? this.stato,
      tipoRiparazione: tipoRiparazione ?? this.tipoRiparazione,
      priorita: priorita ?? this.priorita,
      tecnicoAssegnato: tecnicoAssegnato ?? this.tecnicoAssegnato,
      preventivo: preventivo ?? this.preventivo,
      costoFinale: costoFinale ?? this.costoFinale,
      ricambiUtilizzati: ricambiUtilizzati ?? this.ricambiUtilizzati,
      inGaranzia: inGaranzia ?? this.inGaranzia,
      numeroGaranzia: numeroGaranzia ?? this.numeroGaranzia,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
