import 'package:meta/meta.dart';
import 'base_model.dart';

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
  final GaranziaInfo? garanzia;
  final List<String>? fotoProdotto;

  const Dispositivo({
    required super.id,
    required this.tipo,
    required this.marca,
    required this.modello,
    this.serialNumber,
    this.imei,
    required this.clienteId,
    this.problemiRicorrenti = const [],
    this.riparazioniIds = const [],
    this.specificheTecniche = const {},
    this.accessoriInclusi = const [],
    this.stato = StatoDispositivo.funzionante,
    this.ultimaRiparazione,
    this.note,
    this.garanzia,
    this.fotoProdotto,
    super.createdAt,
    super.updatedAt,
  }) : assert(
          imei == null || RegExp(r'^\d{15}$').hasMatch(imei),
          'IMEI deve essere di 15 cifre',
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'tipo': tipo.name,
      'marca': marca,
      'modello': modello,
      'serialNumber': serialNumber,
      'imei': imei,
      'clienteId': clienteId,
      'problemiRicorrenti': problemiRicorrenti,
      'riparazioniIds': riparazioniIds,
      'specificheTecniche': specificheTecniche,
      'accessoriInclusi': accessoriInclusi.map((a) => a.toMap()).toList(),
      'stato': stato.name,
      'ultimaRiparazione': ultimaRiparazione?.toIso8601String(),
      'note': note,
      'garanzia': garanzia?.toMap(),
      'fotoProdotto': fotoProdotto,
    };
  }

  factory Dispositivo.fromMap(Map<String, dynamic> map) {
    return Dispositivo(
      id: map['id'] as String,
      tipo: TipoDispositivo.values.firstWhere(
        (e) => e.name == (map['tipo'] as String),
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
        (e) => e.name == (map['stato'] as String),
        orElse: () => StatoDispositivo.funzionante,
      ),
      ultimaRiparazione: map['ultimaRiparazione'] != null
          ? DateTime.parse(map['ultimaRiparazione'] as String)
          : null,
      note: map['note'] as String?,
      garanzia: map['garanzia'] != null
          ? GaranziaInfo.fromMap(map['garanzia'] as Map<String, dynamic>)
          : null,
      fotoProdotto: List<String>.from(map['fotoProdotto'] ?? []),
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  @override
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
    GaranziaInfo? garanzia,
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
        'stato': stato.name,
      };

  factory Accessorio.fromMap(Map<String, dynamic> map) => Accessorio(
        nome: map['nome'] as String,
        descrizione: map['descrizione'] as String?,
        stato: StatoAccessorio.values.firstWhere(
          (e) => e.name == (map['stato'] as String),
          orElse: () => StatoAccessorio.presente,
        ),
      );
}

@immutable
class GaranziaInfo {
  final DateTime dataInizio;
  final DateTime dataFine;
  final String? numeroGaranzia;
  final String? fornitore;
  final TipoGaranzia tipo;
  final String? note;

  const GaranziaInfo({
    required this.dataInizio,
    required this.dataFine,
    this.numeroGaranzia,
    this.fornitore,
    this.tipo = TipoGaranzia.standard,
    this.note,
  }) : assert(
          dataFine.isAfter(dataInizio),
          'La data di fine garanzia deve essere successiva alla data di inizio',
        );

  Map<String, dynamic> toMap() => {
        'dataInizio': dataInizio.toIso8601String(),
        'dataFine': dataFine.toIso8601String(),
        'numeroGaranzia': numeroGaranzia,
        'fornitore': fornitore,
        'tipo': tipo.name,
        'note': note,
      };

  factory GaranziaInfo.fromMap(Map<String, dynamic> map) => GaranziaInfo(
        dataInizio: DateTime.parse(map['dataInizio'] as String),
        dataFine: DateTime.parse(map['dataFine'] as String),
        numeroGaranzia: map['numeroGaranzia'] as String?,
        fornitore: map['fornitore'] as String?,
        tipo: TipoGaranzia.values.firstWhere(
          (e) => e.name == (map['tipo'] as String),
          orElse: () => TipoGaranzia.standard,
        ),
        note: map['note'] as String?,
      );

  bool get isValid => DateTime.now().isBefore(dataFine);
  int get giorniRimanenti => dataFine.difference(DateTime.now()).inDays;
}

enum TipoDispositivo {
  smartphone,
  tablet,
  computer,
  console,
  televisore,
  stampante,
  altro
}

enum StatoDispositivo {
  funzionante,
  malfunzionante,
  inRiparazione,
  irreparabile,
  dismesso
}

enum StatoAccessorio { presente, mancante, danneggiato }

enum TipoGaranzia { standard, estesa, commerciale, legale }
