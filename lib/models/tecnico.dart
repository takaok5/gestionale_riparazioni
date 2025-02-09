import 'package:meta/meta.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import '../utils/validators.dart';

@immutable
class Tecnico extends BaseModel {
  final String nome;
  final String cognome;
  final String telefono;
  final String? email;
  final List<String> specializzazioni;
  final StatoTecnico stato;
  final List<DisponibilitaGiornaliera> disponibilita;
  final Map<String, int> riparazioniPerStato;
  final double valutazioneMedia;
  final int numeroRiparazioni;
  final List<String>? certificazioni;
  final List<Competenza> competenze;
  final Map<String, String>? strumentiAssegnati;
  final String? note;
  final String userId;
  final LivelloCertificazione livello;
  final bool disponibileTrasferte;

  const Tecnico({
    required super.id,
    required this.nome,
    required this.cognome,
    required this.telefono,
    this.email,
    this.specializzazioni = const [],
    this.stato = StatoTecnico.attivo,
    this.disponibilita = const [],
    this.riparazioniPerStato = const {},
    this.valutazioneMedia = 0.0,
    this.numeroRiparazioni = 0,
    this.certificazioni,
    this.competenze = const [],
    this.strumentiAssegnati,
    this.note,
    required this.userId,
    this.livello = LivelloCertificazione.junior,
    this.disponibileTrasferte = false,
    super.createdAt,
    super.updatedAt,
  })  : assert(
          Validators.isValidPhoneNumber(telefono),
          'Numero di telefono non valido',
        ),
        assert(
          email == null || Validators.isValidEmail(email),
          'Email non valida',
        );

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'nome': nome,
      'cognome': cognome,
      'telefono': telefono,
      'email': email,
      'specializzazioni': specializzazioni,
      'stato': stato.name,
      'disponibilita': disponibilita.map((d) => d.toMap()).toList(),
      'riparazioniPerStato': riparazioniPerStato,
      'valutazioneMedia': valutazioneMedia,
      'numeroRiparazioni': numeroRiparazioni,
      'certificazioni': certificazioni,
      'competenze': competenze.map((c) => c.toMap()).toList(),
      'strumentiAssegnati': strumentiAssegnati,
      'note': note,
      'userId': userId,
      'livello': livello.name,
      'disponibileTrasferte': disponibileTrasferte,
    };
  }

  factory Tecnico.fromMap(Map<String, dynamic> map) {
    return Tecnico(
      id: map['id'] as String,
      nome: map['nome'] as String,
      cognome: map['cognome'] as String,
      telefono: map['telefono'] as String,
      email: map['email'] as String?,
      specializzazioni: List<String>.from(map['specializzazioni'] ?? []),
      stato: StatoTecnico.values.firstWhere(
        (e) => e.name == (map['stato'] as String),
        orElse: () => StatoTecnico.attivo,
      ),
      disponibilita: (map['disponibilita'] as List<dynamic>?)
              ?.map((d) =>
                  DisponibilitaGiornaliera.fromMap(d as Map<String, dynamic>))
              .toList() ??
          const [],
      riparazioniPerStato:
          Map<String, int>.from(map['riparazioniPerStato'] ?? {}),
      valutazioneMedia: (map['valutazioneMedia'] as num?)?.toDouble() ?? 0.0,
      numeroRiparazioni: map['numeroRiparazioni'] as int? ?? 0,
      certificazioni: List<String>.from(map['certificazioni'] ?? []),
      competenze: (map['competenze'] as List<dynamic>?)
              ?.map((c) => Competenza.fromMap(c as Map<String, dynamic>))
              .toList() ??
          const [],
      strumentiAssegnati: (map['strumentiAssegnati'] as Map<String, dynamic>?)
          ?.map((k, v) => MapEntry(k, v as String)),
      note: map['note'] as String?,
      userId: map['userId'] as String,
      livello: LivelloCertificazione.values.firstWhere(
        (e) => e.name == (map['livello'] as String),
        orElse: () => LivelloCertificazione.junior,
      ),
      disponibileTrasferte: map['disponibileTrasferte'] as bool? ?? false,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  @override
  Tecnico copyWith({
    String? id,
    String? nome,
    String? cognome,
    String? telefono,
    String? email,
    List<String>? specializzazioni,
    StatoTecnico? stato,
    List<DisponibilitaGiornaliera>? disponibilita,
    Map<String, int>? riparazioniPerStato,
    double? valutazioneMedia,
    int? numeroRiparazioni,
    List<String>? certificazioni,
    List<Competenza>? competenze,
    Map<String, String>? strumentiAssegnati,
    String? note,
    String? userId,
    LivelloCertificazione? livello,
    bool? disponibileTrasferte,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Tecnico(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      telefono: telefono ?? this.telefono,
      email: email ?? this.email,
      specializzazioni: specializzazioni ?? this.specializzazioni,
      stato: stato ?? this.stato,
      disponibilita: disponibilita ?? this.disponibilita,
      riparazioniPerStato: riparazioniPerStato ?? this.riparazioniPerStato,
      valutazioneMedia: valutazioneMedia ?? this.valutazioneMedia,
      numeroRiparazioni: numeroRiparazioni ?? this.numeroRiparazioni,
      certificazioni: certificazioni ?? this.certificazioni,
      competenze: competenze ?? this.competenze,
      strumentiAssegnati: strumentiAssegnati ?? this.strumentiAssegnati,
      note: note ?? this.note,
      userId: userId ?? this.userId,
      livello: livello ?? this.livello,
      disponibileTrasferte: disponibileTrasferte ?? this.disponibileTrasferte,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Getter utili
  String get nomeCompleto => '$nome $cognome';
  bool get isDisponibile => stato == StatoTecnico.attivo;
  bool get hasCertificazioni => certificazioni?.isNotEmpty ?? false;
  bool get isEsperto => livello == LivelloCertificazione.senior;
  double get produttivita => numeroRiparazioni > 0
      ? riparazioniCompletate / numeroRiparazioni * 100
      : 0;

  int get riparazioniCompletate => riparazioniPerStato['completate'] ?? 0;
  int get riparazioniInCorso => riparazioniPerStato['inLavorazione'] ?? 0;
}

@immutable
class DisponibilitaGiornaliera {
  final int giorno; // 1-7 dove 1 è Lunedì
  final String oraInizio;
  final String oraFine;
  final bool disponibile;
  final String? note;

  const DisponibilitaGiornaliera({
    required this.giorno,
    required this.oraInizio,
    required this.oraFine,
    this.disponibile = true,
    this.note,
  })  : assert(
          giorno >= 1 && giorno <= 7,
          'Il giorno deve essere compreso tra 1 e 7',
        ),
        assert(
          RegExp(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$').hasMatch(oraInizio),
          'Formato ora inizio non valido (HH:MM)',
        ),
        assert(
          RegExp(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$').hasMatch(oraFine),
          'Formato ora fine non valido (HH:MM)',
        );

  Map<String, dynamic> toMap() => {
        'giorno': giorno,
        'oraInizio': oraInizio,
        'oraFine': oraFine,
        'disponibile': disponibile,
        'note': note,
      };

  factory DisponibilitaGiornaliera.fromMap(Map<String, dynamic> map) =>
      DisponibilitaGiornaliera(
        giorno: map['giorno'] as int,
        oraInizio: map['oraInizio'] as String,
        oraFine: map['oraFine'] as String,
        disponibile: map['disponibile'] as bool? ?? true,
        note: map['note'] as String?,
      );
}

@immutable
class Competenza {
  final String nome;
  final int livello; // 1-5
  final List<String>? certificazioni;
  final DateTime? ultimoAggiornamento;
  final String? note;

  const Competenza({
    required this.nome,
    required this.livello,
    this.certificazioni,
    this.ultimoAggiornamento,
    this.note,
  }) : assert(
          livello >= 1 && livello <= 5,
          'Il livello deve essere compreso tra 1 e 5',
        );

  Map<String, dynamic> toMap() => {
        'nome': nome,
        'livello': livello,
        'certificazioni': certificazioni,
        'ultimoAggiornamento': ultimoAggiornamento?.toIso8601String(),
        'note': note,
      };

  factory Competenza.fromMap(Map<String, dynamic> map) => Competenza(
        nome: map['nome'] as String,
        livello: map['livello'] as int,
        certificazioni: List<String>.from(map['certificazioni'] ?? []),
        ultimoAggiornamento: map['ultimoAggiornamento'] != null
            ? DateTime.parse(map['ultimoAggiornamento'] as String)
            : null,
        note: map['note'] as String?,
      );
}

enum StatoTecnico { attivo, inFerie, malattia, nonDisponibile, cessato }

enum LivelloCertificazione { junior, intermedio, senior, esperto, specialista }
