import 'package:meta/meta.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import 'garanzia_info.dart';
import 'garanzia.dart';
import 'enums/stato_dispositivo.dart';
import 'enums/tipo_dispositivo.dart';
import 'enums/stato_accessorio.dart';

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
  final GaranziaInfo? garanziaInfo;
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
    this.garanziaInfo,
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
    final map = <String, dynamic>{
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
      'ultimaRiparazione': ultimaRiparazione?.toIso8601String(),
      'note': note,
      'garanzia': garanzia?.toMap(),
      'garanziaInfo': garanziaInfo?.toMap(),
      'fotoProdotto': fotoProdotto,
    };
    return map;
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
          ? DateTime.parse(map['ultimaRiparazione'] as String)
          : null,
      note: map['note'] as String?,
      garanzia: map['garanzia'] != null
          ? Garanzia.fromMap(map['garanzia'] as Map<String, dynamic>)
          : null,
      garanziaInfo: map['garanziaInfo'] != null
          ? GaranziaInfo.fromMap(map['garanziaInfo'] as Map<String, dynamic>)
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
    GaranziaInfo? garanziaInfo,
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
      problemiRicorrenti: problemiRicorrenti ?? this.problemiRicorrenti,
      riparazioniIds: riparazioniIds ?? this.riparazioniIds,
      specificheTecniche: specificheTecniche ?? this.specificheTecniche,
      accessoriInclusi: accessoriInclusi ?? this.accessoriInclusi,
      stato: stato ?? this.stato,
      ultimaRiparazione: ultimaRiparazione ?? this.ultimaRiparazione,
      note: note ?? this.note,
      garanzia: garanzia ?? this.garanzia,
      garanziaInfo: garanziaInfo ?? this.garanziaInfo,
      fotoProdotto: fotoProdotto ?? this.fotoProdotto,
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
}
