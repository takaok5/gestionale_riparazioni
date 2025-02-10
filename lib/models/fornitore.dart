import '../enums/enums.dart';

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
    this.codiceFiscale = '', // provide default values
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
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
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
      createdAt: DateTime.parse(map['createdAt']),
      updatedAt: DateTime.parse(map['updatedAt']),
    );
  }
}
