import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class Fornitore {
  final String id;
  final String nome;
  final String ragioneSociale;
  final String partitaIva;
  final String codiceFiscale;
  final String email;
  final String telefono;
  final String indirizzo;
  final String pec;
  final String codiceUnivoco;
  final String note;
  final double scontoAcquisto;
  final double scontoVendita;
  final double margine;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Fornitore({
    required this.id,
    required this.nome,
    required this.email,
    required this.telefono,
    required this.partitaIva,
    this.codiceFiscale = '',
    required this.ragioneSociale,
    this.indirizzo = '',
    this.pec = '',
    this.codiceUnivoco = '',
    this.note = '',
    this.scontoAcquisto = 0.0,
    this.scontoVendita = 0.0,
    this.margine = 0.0,
    required this.createdAt,
    required this.updatedAt,
  });

  // Getters per le date formattate
  String get dataRegistrazione => AppDateUtils.formatDate(createdAt);
  String get dataRegistrazioneCompleta => AppDateUtils.formatDateTime(createdAt);
  String get ultimoAggiornamento => AppDateUtils.formatDateTime(updatedAt);
  String get tempoTrascorsoDaRegistrazione => AppDateUtils.timeAgo(createdAt);
  String get tempoTrascorsoDaAggiornamento => AppDateUtils.timeAgo(updatedAt);

  Map<String, dynamic> toMap() {
    return {
      'ragioneSociale': ragioneSociale,
      'partitaIva': partitaIva,
      'codiceFiscale': codiceFiscale,
      'email': email,
      'telefono': telefono,
      'indirizzo': indirizzo,
      'pec': pec,
      'codiceUnivoco': codiceUnivoco,
      'note': note,
      'scontoAcquisto': scontoAcquisto,
      'scontoVendita': scontoVendita,
      'margine': margine,
      'createdAt': AppDateUtils.toISOString(createdAt),
      'updatedAt': AppDateUtils.toISOString(updatedAt),
    };
  }

  factory Fornitore.fromMap(Map<String, dynamic> map) {
    return Fornitore(
      id: map['id'],
      nome: map['nome'] as String,
      ragioneSociale: map['ragioneSociale'],
      partitaIva: map['partitaIva'],
      codiceFiscale: map['codiceFiscale'],
      email: map['email'],
      telefono: map['telefono'],
      indirizzo: map['indirizzo'],
      pec: map['pec'],
      codiceUnivoco: map['codiceUnivoco'],
      note: map['note'],
      scontoAcquisto: map['scontoAcquisto']?.toDouble() ?? 0.0,
      scontoVendita: map['scontoVendita']?.toDouble() ?? 0.0,
      margine: map['margine']?.toDouble() ?? 0.0,
      createdAt: AppDateUtils.parseISOString(map['createdAt']) ?? DateTime.now(),
      updatedAt: AppDateUtils.parseISOString(map['updatedAt']) ?? DateTime.now(),
    );
  }

  // Metodo di utilità per creare una copia con modifiche
  Fornitore copyWith({
    String? id,
    String? nome,
    String? ragioneSociale,
    String? partitaIva,
    String? codiceFiscale,
    String? email,
    String? telefono,
    String? indirizzo,
    String? pec,
    String? codiceUnivoco,
    String? note,
    double? scontoAcquisto,
    double? scontoVendita,
    double? margine,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Fornitore(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      ragioneSociale: ragioneSociale ?? this.ragioneSociale,
      partitaIva: partitaIva ?? this.partitaIva,
      codiceFiscale: codiceFiscale ?? this.codiceFiscale,
      email: email ?? this.email,
      telefono: telefono ?? this.telefono,
      indirizzo: indirizzo ?? this.indirizzo,
      pec: pec ?? this.pec,
      codiceUnivoco: codiceUnivoco ?? this.codiceUnivoco,
      note: note ?? this.note,
      scontoAcquisto: scontoAcquisto ?? this.scontoAcquisto,
      scontoVendita: scontoVendita ?? this.scontoVendita,
      margine: margine ?? this.margine,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}