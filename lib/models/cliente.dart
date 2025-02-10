import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import '../utils/exceptions.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class Cliente extends Equatable {
  final String id;
  final String nome;
  final String cognome;
  final String email;
  final String telefono;
  final String? telefonoSecondario;
  final String? indirizzo;
  final String? citta;
  final String? cap;
  final String? provincia;
  final String? note;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? codiceFiscale;
  final String? partitaIva;
  final String? pec;
  final String? codiceDestinatario;
  final TipoCliente tipo;
  final bool attivo;
  final int numeroRiparazioni;
  final double totaleSpeso;
  final DateTime? ultimaRiparazione;
  final Map<String, dynamic>? metadati;

  const Cliente({
    required this.id,
    required this.nome,
    required this.cognome,
    required this.email,
    required this.telefono,
    this.telefonoSecondario,
    this.indirizzo,
    this.citta,
    this.cap,
    this.provincia,
    this.note,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.codiceFiscale,
    this.partitaIva,
    this.pec,
    this.codiceDestinatario,
    this.tipo = TipoCliente.privato,
    this.attivo = true,
    this.totaleSpeso = 0.0,
    this.numeroRiparazioni = 0,
    this.ultimaRiparazione,
    this.metadati,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Getters esistenti
  String get nominativoCompleto => '$nome $cognome'.trim();
  String get iniziali =>
      '${nome.isNotEmpty ? nome[0] : ''}${cognome.isNotEmpty ? cognome[0] : ''}'
          .toUpperCase();
  String get indirizzoCompleto => [indirizzo, cap, citta, provincia]
      .where((e) => e != null && e.isNotEmpty)
      .join(', ');
  bool get isAzienda => tipo == TipoCliente.azienda;
  bool get isProfessionista => tipo == TipoCliente.professionista;
  bool get isPrivato => tipo == TipoCliente.privato;
  bool get hasPiva => partitaIva != null && partitaIva!.isNotEmpty;
  bool get hasCodiceFiscale =>
      codiceFiscale != null && codiceFiscale!.isNotEmpty;

  // Nuovi getters per le date
  String get dataCreazione => AppDateUtils.formatDateTime(createdAt);
  String get dataUltimoAggiornamento => AppDateUtils.formatDateTime(updatedAt);
  String get dataUltimaRiparazione => ultimaRiparazione != null 
      ? AppDateUtils.formatDateTime(ultimaRiparazione!)
      : 'Nessuna riparazione';

  bool get hasRiparazioniRecenti => ultimaRiparazione != null && 
      AppDateUtils.isWithinLastDays(ultimaRiparazione!, 30);

  bool get isClienteRecente => 
      AppDateUtils.isWithinLastDays(createdAt, 90);

  void validate() {
    // ... [il resto del metodo validate rimane invariato]
  }

  Cliente copyWith({
    String? id,
    String? nome,
    String? cognome,
    String? email,
    String? telefono,
    String? telefonoSecondario,
    String? indirizzo,
    String? citta,
    String? cap,
    String? provincia,
    String? note,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? codiceFiscale,
    String? partitaIva,
    String? pec,
    String? codiceDestinatario,
    TipoCliente? tipo,
    bool? attivo,
    int? numeroRiparazioni,
    double? totaleSpeso,
    DateTime? ultimaRiparazione,
    Map<String, dynamic>? metadati,
  }) {
    return Cliente(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      email: email ?? this.email,
      telefono: telefono ?? this.telefono,
      telefonoSecondario: telefonoSecondario ?? this.telefonoSecondario,
      indirizzo: indirizzo ?? this.indirizzo,
      citta: citta ?? this.citta,
      cap: cap ?? this.cap,
      provincia: provincia ?? this.provincia,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      codiceFiscale: codiceFiscale ?? this.codiceFiscale,
      partitaIva: partitaIva ?? this.partitaIva,
      pec: pec ?? this.pec,
      codiceDestinatario: codiceDestinatario ?? this.codiceDestinatario,
      tipo: tipo ?? this.tipo,
      attivo: attivo ?? this.attivo,
      numeroRiparazioni: numeroRiparazioni ?? this.numeroRiparazioni,
      totaleSpeso: totaleSpeso ?? this.totaleSpeso,
      ultimaRiparazione: ultimaRiparazione ?? this.ultimaRiparazione,
      metadati: metadati ?? Map.from(this.metadati ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome': nome,
      'cognome': cognome,
      'email': email,
      'telefono': telefono,
      'telefonoSecondario': telefonoSecondario,
      'indirizzo': indirizzo,
      'citta': citta,
      'cap': cap,
      'provincia': provincia,
      'note': note,
      'createdAt': AppDateUtils.toISOString(createdAt),
      'updatedAt': AppDateUtils.toISOString(updatedAt),
      'codiceFiscale': codiceFiscale,
      'partitaIva': partitaIva,
      'pec': pec,
      'codiceDestinatario': codiceDestinatario,
      'tipo': tipo.name,
      'attivo': attivo,
      'numeroRiparazioni': numeroRiparazioni,
      'totaleSpeso': totaleSpeso,
      'ultimaRiparazione': ultimaRiparazione != null
          ? AppDateUtils.toISOString(ultimaRiparazione!)
          : null,
      'metadati': metadati,
    };
  }

  factory Cliente.fromMap(Map<String, dynamic> map) {
    return Cliente(
      id: map['id'] ?? '',
      nome: map['nome'] ?? '',
      cognome: map['cognome'] ?? '',
      email: map['email'] ?? '',
      telefono: map['telefono'] ?? '',
      telefonoSecondario: map['telefonoSecondario'],
      indirizzo: map['indirizzo'],
      citta: map['citta'],
      cap: map['cap'],
      provincia: map['provincia'],
      note: map['note'],
      createdAt: map['createdAt'] is Timestamp 
          ? (map['createdAt'] as Timestamp).toDate()
          : AppDateUtils.parseISOString(map['createdAt']) ?? DateTime.now(),
      updatedAt: map['updatedAt'] is Timestamp
          ? (map['updatedAt'] as Timestamp).toDate()
          : AppDateUtils.parseISOString(map['updatedAt']) ?? DateTime.now(),
      codiceFiscale: map['codiceFiscale'],
      partitaIva: map['partitaIva'],
      pec: map['pec'],
      codiceDestinatario: map['codiceDestinatario'],
      tipo: TipoCliente.values.firstWhere(
        (t) => t.name == map['tipo'],
        orElse: () => TipoCliente.privato,
      ),
      attivo: map['attivo'] ?? true,
      numeroRiparazioni: map['numeroRiparazioni'] ?? 0,
      totaleSpeso: (map['totaleSpeso'] ?? 0.0).toDouble(),
      ultimaRiparazione: map['ultimaRiparazione'] is Timestamp
          ? (map['ultimaRiparazione'] as Timestamp).toDate()
          : AppDateUtils.parseISOString(map['ultimaRiparazione']),
      metadati: map['metadati'] as Map<String, dynamic>?,
    );
  }

  @override
  List<Object?> get props => [
        id,
        nome,
        cognome,
        email,
        telefono,
        telefonoSecondario,
        indirizzo,
        citta,
        cap,
        provincia,
        note,
        createdAt,
        updatedAt,
        codiceFiscale,
        partitaIva,
        pec,
        codiceDestinatario,
        tipo,
        attivo,
        numeroRiparazioni,
        totaleSpeso,
        ultimaRiparazione,
        metadati,
      ];

  @override
  String toString() =>
      'Cliente(id: $id, nome: $nome, cognome: $cognome, tipo: ${tipo.name})';
}