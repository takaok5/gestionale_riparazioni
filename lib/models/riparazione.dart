import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../utils/imports.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import '../enums/enums.dart';
import 'dispositivo.dart';
import 'cliente.dart';
import 'tecnico.dart';
import 'ricambio.dart';
import 'base_model.dart';

@immutable
abstract class BaseRiparazione extends BaseModel {
  final String descrizione;
  final DateTime dataIngresso;
  final double? costoFinale;

  const BaseRiparazione({
    required String id,
    required this.descrizione,
    required this.dataIngresso,
    this.costoFinale,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(id: id, createdAt: createdAt, updatedAt: updatedAt);
}

class Riparazione extends BaseRiparazione {
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

  const Riparazione({
    required String id,
    required this.cliente,
    required this.dispositivo,
    required String descrizioneProblema,
    this.noteInterne,
    this.dataCompletamento,
    this.dataConsegna,
    required this.stato,
    required this.tipoRiparazione,
    required this.priorita,
    this.tecnicoAssegnato,
    this.preventivo,
    double? costoFinale,
    this.ricambiUtilizzati,
    required this.inGaranzia,
    this.numeroGaranzia,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          descrizione: descrizioneProblema,
          dataIngresso: createdAt,
          costoFinale: costoFinale,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  // Getters for common properties
  String get tipo => tipoRiparazione.toString().split('.').last;
  DateTime? get appuntamento => dataCompletamento;
  double get prezzo => preventivo ?? 0.0;
  double get costoRicambi =>
      ricambiUtilizzati?.fold(
          0.0, (sum, ricambio) => sum + (ricambio.prezzo ?? 0)) ??
      0.0;
  double get costoManodopera => (costoFinale ?? 0.0) - costoRicambi;

  bool get isCompletato => dataCompletamento != null;
  bool get isConsegnato => dataConsegna != null;
  bool get isInRitardo {
    if (dataCompletamento == null) return false;
    return AppDateUtils.isPast(dataCompletamento!);
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'clienteId': cliente.id,
      'dispositivo': dispositivo.toMap(),
      'descrizioneProblema': descrizione,
      'noteInterne': noteInterne,
      'dataCompletamento': dataCompletamento != null
          ? Timestamp.fromDate(AppDateUtils.toUtc(dataCompletamento!))
          : null,
      'dataConsegna': dataConsegna != null
          ? Timestamp.fromDate(AppDateUtils.toUtc(dataConsegna!))
          : null,
      'stato': stato.toString().split('.').last,
      'tipoRiparazione': tipoRiparazione.toString().split('.').last,
      'priorita': priorita.toString().split('.').last,
      'tecnicoAssegnatoId': tecnicoAssegnato?.id,
      'preventivo': preventivo,
      'costoFinale': costoFinale,
      'ricambiUtilizzati': ricambiUtilizzati?.map((r) => r.toMap()).toList(),
      'inGaranzia': inGaranzia,
      'numeroGaranzia': numeroGaranzia,
    };
  }

  static Riparazione fromMap(
    Map<String, dynamic> map, {
    required Cliente cliente,
    Tecnico? tecnico,
    List<Ricambio>? ricambi,
  }) {
    return Riparazione(
      id: map['id'] as String,
      cliente: cliente,
      dispositivo:
          Dispositivo.fromMap(map['dispositivo'] as Map<String, dynamic>),
      descrizioneProblema: map['descrizioneProblema'] as String,
      noteInterne: map['noteInterne'] as String?,
      dataCompletamento: map['dataCompletamento'] != null
          ? (map['dataCompletamento'] as Timestamp).toDate()
          : null,
      dataConsegna: map['dataConsegna'] != null
          ? (map['dataConsegna'] as Timestamp).toDate()
          : null,
      stato: StatoRiparazione.values.firstWhere(
        (e) => e.toString().split('.').last == map['stato'],
        orElse: () => StatoRiparazione.inAttesa,
      ),
      tipoRiparazione: TipoRiparazione.values.firstWhere(
        (e) => e.toString().split('.').last == map['tipoRiparazione'],
        orElse: () => TipoRiparazione.riparazione,
      ),
      priorita: PrioritaRiparazione.values.firstWhere(
        (e) => e.toString().split('.').last == map['priorita'],
        orElse: () => PrioritaRiparazione.normale,
      ),
      tecnicoAssegnato: tecnico,
      preventivo: map['preventivo'] as double?,
      costoFinale: map['costoFinale'] as double?,
      ricambiUtilizzati: ricambi,
      inGaranzia: map['inGaranzia'] as bool? ?? false,
      numeroGaranzia: map['numeroGaranzia'] as String?,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

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
      dettagliRicambi: ricambiUtilizzati?.fold<Map<String, dynamic>>(
        {},
        (map, ricambio) => {
          ...map,
          ricambio.id: ricambio.toMap(),
        },
      ),
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  Riparazione copyWith({
    String? id,
    Cliente? cliente,
    Dispositivo? dispositivo,
    String? descrizioneProblema,
    String? noteInterne,
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
      descrizioneProblema: descrizioneProblema ?? descrizione,
      noteInterne: noteInterne ?? this.noteInterne,
      dataCompletamento: dataCompletamento ?? this.dataCompletamento,
      dataConsegna: dataConsegna ?? this.dataConsegna,
      stato: stato ?? this.stato,
      tipoRiparazione: tipoRiparazione ?? this.tipoRiparazione,
      priorita: priorita ?? this.priorita,
      tecnicoAssegnato: tecnicoAssegnato ?? this.tecnicoAssegnato,
      preventivo: preventivo ?? this.preventivo,
      costoFinale: costoFinale ?? this.costoFinale,
      ricambiUtilizzati:
          ricambiUtilizzati ?? List.from(this.ricambiUtilizzati ?? []),
      inGaranzia: inGaranzia ?? this.inGaranzia,
      numeroGaranzia: numeroGaranzia ?? this.numeroGaranzia,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class RiparazioneArchiviata extends BaseRiparazione {
  final String clienteId;
  final String dispositivo;
  final DateTime dataUscita;
  final double costoRicambi;
  final double costoManodopera;
  final double totalePattuito;
  final String? note;
  final Map<String, dynamic>? dettagliRicambi;

  const RiparazioneArchiviata({
    required String id,
    required this.clienteId,
    required this.dispositivo,
    required String problema,
    required DateTime dataIngresso,
    required this.dataUscita,
    required this.costoRicambi,
    required this.costoManodopera,
    required this.totalePattuito,
    this.note,
    this.dettagliRicambi,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          descrizione: problema,
          dataIngresso: dataIngresso,
          costoFinale: totalePattuito,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'clienteId': clienteId,
      'dispositivo': dispositivo,
      'problema': descrizione,
      'dataUscita': Timestamp.fromDate(AppDateUtils.toUtc(dataUscita)),
      'costoRicambi': costoRicambi,
      'costoManodopera': costoManodopera,
      'totalePattuito': totalePattuito,
      'note': note,
      'dettagliRicambi': dettagliRicambi,
    };
  }

  factory RiparazioneArchiviata.fromMap(Map<String, dynamic> map) {
    return RiparazioneArchiviata(
      id: map['id'] as String,
      clienteId: map['clienteId'] as String,
      dispositivo: map['dispositivo'] as String,
      problema: map['problema'] as String,
      dataIngresso: (map['dataIngresso'] as Timestamp).toDate(),
      dataUscita: (map['dataUscita'] as Timestamp).toDate(),
      costoRicambi: (map['costoRicambi'] as num).toDouble(),
      costoManodopera: (map['costoManodopera'] as num).toDouble(),
      totalePattuito: (map['totalePattuito'] as num).toDouble(),
      note: map['note'] as String?,
      dettagliRicambi: map['dettagliRicambi'] as Map<String, dynamic>?,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }
}

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
        borderRadius: BorderRadius.circular(8),
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
                      color: _getStatusColor().withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _getStatusText(),
                      style: TextStyle(
                        color: _getStatusColor(),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
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
                  'Appuntamento: ${AppDateUtils.formatDateTime(riparazione.appuntamento!)}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ingresso: ${AppDateUtils.formatDate(riparazione.dataIngresso)}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  if (riparazione.prezzo > 0)
                    Text(
                      '€ ${riparazione.costoFinale?.toStringAsFixed(2) ?? riparazione.prezzo.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                ],
              ),
              if (riparazione.tecnicoAssegnato != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.person, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      'Tecnico: ${riparazione.tecnicoAssegnato!.nome}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
              if (riparazione.inGaranzia) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.security, size: 16, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(
                      'In Garanzia${riparazione.numeroGaranzia != null ? ' (${riparazione.numeroGaranzia})' : ''}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.green,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (riparazione.stato) {
      case StatoRiparazione.inAttesa:
        return Colors.orange;
      case StatoRiparazione.inLavorazione:
        return Colors.blue;
      case StatoRiparazione.completata:
        return Colors.green;
      case StatoRiparazione.consegnata:
        return Colors.purple;
      case StatoRiparazione.annullata:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText() {
    switch (riparazione.stato) {
      case StatoRiparazione.inAttesa:
        return 'In Attesa';
      case StatoRiparazione.inLavorazione:
        return 'In Lavorazione';
      case StatoRiparazione.completata:
        return 'Completata';
      case StatoRiparazione.consegnata:
        return 'Consegnata';
      case StatoRiparazione.annullata:
        return 'Annullata';
      default:
        return 'Sconosciuto';
    }
  }
}
