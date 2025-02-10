import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';
import '../utils/exceptions.dart';

enum TipoCliente {
  privato,
  azienda,
  professionista;

  String get label {
    switch (this) {
      case TipoCliente.privato:
        return 'Privato';
      case TipoCliente.azienda:
        return 'Azienda';
      case TipoCliente.professionista:
        return 'Professionista';
    }
  }
}

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
    this.numeroRiparazioni = 0,
    this.totaleSpeso = 0.0,
    this.ultimaRiparazione,
    this.metadati,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  // Getters
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

  void validate() {
    if (id.isEmpty) {
      throw ValidationException('ID cliente non può essere vuoto');
    }
    if (nome.isEmpty) {
      throw ValidationException('Nome non può essere vuoto');
    }
    if (cognome.isEmpty) {
      throw ValidationException('Cognome non può essere vuoto');
    }
    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      throw ValidationException('Email non valida');
    }
    if (telefono.isEmpty || telefono.length < 8) {
      throw ValidationException('Numero di telefono non valido');
    }
    if (telefonoSecondario != null && telefonoSecondario!.length < 8) {
      throw ValidationException('Numero di telefono secondario non valido');
    }
    if (cap != null && !RegExp(r'^\d{5}$').hasMatch(cap!)) {
      throw ValidationException('CAP non valido');
    }
    if (codiceFiscale != null && codiceFiscale!.length != 16) {
      throw ValidationException('Codice fiscale non valido');
    }
    if (partitaIva != null && !RegExp(r'^\d{11}$').hasMatch(partitaIva!)) {
      throw ValidationException('Partita IVA non valida');
    }
    if (pec != null &&
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(pec!)) {
      throw ValidationException('PEC non valida');
    }
    if (codiceDestinatario != null &&
        !RegExp(r'^[A-Z0-9]{7}$').hasMatch(codiceDestinatario!)) {
      throw ValidationException('Codice destinatario non valido');
    }
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
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'codiceFiscale': codiceFiscale,
      'partitaIva': partitaIva,
      'pec': pec,
      'codiceDestinatario': codiceDestinatario,
      'tipo': tipo.name,
      'attivo': attivo,
      'numeroRiparazioni': numeroRiparazioni,
      'totaleSpeso': totaleSpeso,
      'ultimaRiparazione': ultimaRiparazione != null
          ? Timestamp.fromDate(ultimaRiparazione!)
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
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
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
      ultimaRiparazione: map['ultimaRiparazione'] != null
          ? (map['ultimaRiparazione'] as Timestamp).toDate()
          : null,
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
