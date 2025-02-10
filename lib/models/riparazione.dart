import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../utils/imports.dart';
import '../utils/date_formatter.dart';
import '../enums/enums.dart';
import 'dispositivo.dart';
import 'cliente.dart';
import 'tecnico.dart';
import 'ricambio.dart';
import 'base_model.dart';

// Base class for common repair properties
abstract class BaseRiparazione extends BaseModel {
  final String id;
  final String descrizione;
  final DateTime dataIngresso;
  final double? costoFinale;

  const BaseRiparazione({
    required this.id,
    required this.descrizione,
    required this.dataIngresso,
    this.costoFinale,
  });
}

// Main repair model
class Riparazione extends BaseModel {
  final Cliente cliente;
  final Dispositivo dispositivo;
  final String? noteInterne;
  final DateTime? dataCompletamento;
  final DateTime? dataConsegna;
  final StatoRiparazione stato;
  final TipoRiparazione tipoRiparazione;
  final PrioritaRiparazione priorita;
  final Tecnico? tecnicoAssegnato;
  final double? preventivo;
  final List<Ricambio>? ricambiUtilizzati;
  final bool inGaranzia;
  final String? numeroGaranzia;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Riparazione({
    required String id,
    required DateTime createdAt,
    required DateTime updatedAt,
    required super.id,
    required this.cliente,
    required this.dispositivo,
    required String descrizioneProblema, // passed to super.descrizione
    this.noteInterne,
    this.dataCompletamento,
    this.dataConsegna,
    required this.stato,
    required this.tipoRiparazione,
    required this.priorita,
    this.tecnicoAssegnato,
    this.preventivo,
    super.costoFinale,
    this.ricambiUtilizzati,
    required this.inGaranzia,
    this.numeroGaranzia,
    required this.createdAt,
    required this.updatedAt,
  }) : super(id: id, createdAt: createdAt, updatedAt: updatedAt);

  // Getters for common properties
  String get tipo => tipoRiparazione.toString().split('.').last;
  DateTime? get appuntamento => dataCompletamento;
  double get prezzo => preventivo ?? 0.0;
  double get costoRicambi =>
      ricambiUtilizzati?.fold(
        0.0,
        (sum, ricambio) => sum + (ricambio.prezzo ?? 0),
      ) ??
      0.0;
  double get costoManodopera => (costoFinale ?? 0.0) - costoRicambi;

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': cliente.id,
      'dispositivo': dispositivo.toMap(),
      'descrizioneProblema': descrizione,
      'noteInterne': noteInterne,
      'dataRicezione': Timestamp.fromDate(dataIngresso),
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

  // Convert to archived repair
  RiparazioneArchiviata toArchiviata() {
    return RiparazioneArchiviata(
      id: id,
      clienteId: cliente.id,
      dispositivo: dispositivo.toString(),
      problema: descrizione,
      dataIngresso: dataIngresso,
      dataUscita: dataConsegna ?? DateTime.now(),
      costoRicambi: costoRicambi,
      costoManodopera: costoManodopera,
      totalePattuito: costoFinale ?? 0.0,
      note: noteInterne,
      dettagliRicambi: {
        for (var ricambio in (ricambiUtilizzati ?? []))
          ricambio.id: ricambio.toMap(),
      },
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
      descrizioneProblema: descrizioneProblema ?? this.descrizione,
      noteInterne: noteInterne ?? this.noteInterne,
      dataRicezione: dataRicezione ?? this.dataIngresso,
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

// Archived repair model
class RiparazioneArchiviata extends BaseRiparazione {
  final String clienteId;
  final DateTime dataUscita;
  final double costoRicambi;
  final double costoManodopera;
  final double totalePattuito;
  final String? note;
  final Map<String, dynamic>? dettagliRicambi;

  RiparazioneArchiviata({
    required super.id,
    required this.clienteId,
    required String dispositivo,
    required String problema,
    required super.dataIngresso,
    required this.dataUscita,
    required this.costoRicambi,
    required this.costoManodopera,
    required this.totalePattuito,
    this.note,
    this.dettagliRicambi,
  }) : super(
          descrizione: problema,
          costoFinale: totalePattuito,
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'dispositivo': descrizione,
      'problema': descrizione,
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

// Widget for displaying repair information
class RiparazioneCard extends StatelessWidget {
  final Riparazione riparazione;
  final VoidCallback onTap;

  const RiparazioneCard({
    Key? key,
    required this.riparazione,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    riparazione.tipo,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: riparazione.stato.color.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      riparazione.stato.display,
                      style: TextStyle(
                        color: riparazione.stato.color,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                riparazione.descrizione,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              if (riparazione.appuntamento != null) ...[
                Text(
                  'Appuntamento: ${DateFormatter.formatDateTime(riparazione.appuntamento!)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ingresso: ${DateFormatter.formatDate(riparazione.dataIngresso)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  if (riparazione.prezzo > 0)
                    Text(
                      '€ ${riparazione.costoFinale?.toStringAsFixed(2) ?? '-'}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
