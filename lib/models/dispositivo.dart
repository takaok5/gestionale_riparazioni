import 'package:meta/meta.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import 'garanzia.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

@immutable
class Dispositivo extends BaseModel {
  final TipoDispositivo tipo;
  final String marca;
  final String modello;
  final String? serialNumber;
  final String? imei;
  final String clienteId;
  final List<String> problemiRicorrenti;
  final List<String> riparazioniIds;
  final Map<String, String> specificheTecniche;
  final List<Accessorio> accessoriInclusi;
  final StatoDispositivo stato;
  final DateTime? ultimaRiparazione;
  final String? note;
  final Garanzia? garanzia;
  final List<String>? fotoProdotto;

  Dispositivo({
    required String id,
    required this.tipo,
    required this.marca,
    required this.modello,
    this.serialNumber,
    this.imei,
    required this.clienteId,
    List<String>? problemiRicorrenti,
    List<String>? riparazioniIds,
    Map<String, String>? specificheTecniche,
    List<Accessorio>? accessoriInclusi,
    this.stato = StatoDispositivo.funzionante,
    this.ultimaRiparazione,
    this.note,
    this.garanzia,
    this.fotoProdotto,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : problemiRicorrenti = problemiRicorrenti ?? const [],
        riparazioniIds = riparazioniIds ?? const [],
        specificheTecniche = specificheTecniche ?? const {},
        accessoriInclusi = accessoriInclusi ?? const [],
        assert(
          imei == null || RegExp(r'^\d{15}$').hasMatch(imei),
          'IMEI deve essere di 15 cifre',
        ),
        super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'tipo': tipo.toString().split('.').last,
      'marca': marca,
      'modello': modello,
      'serialNumber': serialNumber,
      'imei': imei,
      'clienteId': clienteId,
      'problemiRicorrenti': problemiRicorrenti,
      'riparazioniIds': riparazioniIds,
      'specificheTecniche': specificheTecniche,
      'accessoriInclusi': accessoriInclusi.map((a) => a.toMap()).toList(),
      'stato': stato.toString().split('.').last,
      'ultimaRiparazione': ultimaRiparazione != null
          ? Timestamp.fromDate(AppDateUtils.toUtc(ultimaRiparazione!))
          : null,
      'note': note,
      'garanzia': garanzia?.toMap(),
      'fotoProdotto': fotoProdotto,
    };
  }

  factory Dispositivo.fromMap(Map<String, dynamic> map) {
    return Dispositivo(
      id: map['id'] as String,
      tipo: TipoDispositivo.values.firstWhere(
        (e) => e.toString().split('.').last == map['tipo'],
        orElse: () => TipoDispositivo.altro,
      ),
      marca: map['marca'] as String,
      modello: map['modello'] as String,
      serialNumber: map['serialNumber'] as String?,
      imei: map['imei'] as String?,
      clienteId: map['clienteId'] as String,
      problemiRicorrenti: List<String>.from(map['problemiRicorrenti'] ?? []),
      riparazioniIds: List<String>.from(map['riparazioniIds'] ?? []),
      specificheTecniche:
          Map<String, String>.from(map['specificheTecniche'] ?? {}),
      accessoriInclusi: (map['accessoriInclusi'] as List<dynamic>?)
              ?.map((a) => Accessorio.fromMap(a as Map<String, dynamic>))
              .toList() ??
          const [],
      stato: StatoDispositivo.values.firstWhere(
        (e) => e.toString().split('.').last == map['stato'],
        orElse: () => StatoDispositivo.funzionante,
      ),
      ultimaRiparazione: map['ultimaRiparazione'] != null
          ? (map['ultimaRiparazione'] as Timestamp).toDate()
          : null,
      note: map['note'] as String?,
      garanzia: map['garanzia'] != null
          ? map['garanzia']['tipo'] == 'interna'
              ? GaranziaInterna.fromMap(map['garanzia'] as Map<String, dynamic>)
              : GaranziaFornitore.fromMap(
                  map['garanzia'] as Map<String, dynamic>)
          : null,
      fotoProdotto: List<String>.from(map['fotoProdotto'] ?? []),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Dispositivo copyWith({
    String? id,
    TipoDispositivo? tipo,
    String? marca,
    String? modello,
    String? serialNumber,
    String? imei,
    String? clienteId,
    List<String>? problemiRicorrenti,
    List<String>? riparazioniIds,
    Map<String, String>? specificheTecniche,
    List<Accessorio>? accessoriInclusi,
    StatoDispositivo? stato,
    DateTime? ultimaRiparazione,
    String? note,
    Garanzia? garanzia,
    List<String>? fotoProdotto,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Dispositivo(
      id: id ?? this.id,
      tipo: tipo ?? this.tipo,
      marca: marca ?? this.marca,
      modello: modello ?? this.modello,
      serialNumber: serialNumber ?? this.serialNumber,
      imei: imei ?? this.imei,
      clienteId: clienteId ?? this.clienteId,
      problemiRicorrenti:
          problemiRicorrenti ?? List.from(this.problemiRicorrenti),
      riparazioniIds: riparazioniIds ?? List.from(this.riparazioniIds),
      specificheTecniche:
          specificheTecniche ?? Map.from(this.specificheTecniche),
      accessoriInclusi: accessoriInclusi ?? List.from(this.accessoriInclusi),
      stato: stato ?? this.stato,
      ultimaRiparazione: ultimaRiparazione ?? this.ultimaRiparazione,
      note: note ?? this.note,
      garanzia: garanzia ?? this.garanzia,
      fotoProdotto: fotoProdotto ??
          (this.fotoProdotto != null ? List.from(this.fotoProdotto!) : null),
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Getter utili
  String get nomeCompleto => '$marca $modello';
  bool get inGaranzia => garanzia?.isValid ?? false;
  bool get hasProblemiRicorrenti => problemiRicorrenti.isNotEmpty;
  bool get hasRiparazioni => riparazioniIds.isNotEmpty;
  bool get hasFoto => fotoProdotto?.isNotEmpty ?? false;
  bool get isSmartphone => tipo == TipoDispositivo.smartphone;
  bool get isTablet => tipo == TipoDispositivo.tablet;
  bool get isComputer => tipo == TipoDispositivo.computer;
  bool get hasUltimaRiparazioneRecente =>
      ultimaRiparazione != null &&
      DateTime.now().difference(ultimaRiparazione!).inDays <= 30;

  String formatUltimaRiparazione() {
    return ultimaRiparazione != null
        ? AppDateUtils.formatDateTime(ultimaRiparazione!)
        : 'Nessuna riparazione';
  }

  bool isRiparatoInData(DateTime data) {
    return ultimaRiparazione != null &&
        AppDateUtils.isSameDay(ultimaRiparazione!, data);
  }
}

@immutable
class Accessorio {
  final String nome;
  final String? descrizione;
  final StatoAccessorio stato;

  const Accessorio({
    required this.nome,
    this.descrizione,
    this.stato = StatoAccessorio.presente,
  });

  Map<String, dynamic> toMap() => {
        'nome': nome,
        'descrizione': descrizione,
        'stato': stato.toString().split('.').last,
      };

  factory Accessorio.fromMap(Map<String, dynamic> map) => Accessorio(
        nome: map['nome'] as String,
        descrizione: map['descrizione'] as String?,
        stato: StatoAccessorio.values.firstWhere(
          (e) => e.toString().split('.').last == map['stato'],
          orElse: () => StatoAccessorio.presente,
        ),
      );

  Accessorio copyWith({
    String? nome,
    String? descrizione,
    StatoAccessorio? stato,
  }) {
    return Accessorio(
      nome: nome ?? this.nome,
      descrizione: descrizione ?? this.descrizione,
      stato: stato ?? this.stato,
    );
  }
}
