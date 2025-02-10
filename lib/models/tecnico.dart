import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class Tecnico extends BaseModel {
  final String id;
  final String nome;
  final String cognome;
  final String email;
  final String telefono;
  final bool attivo;
  final Map<String, bool> disponibilita;
  final List<String> certificazioni;
  final List<String> competenze;
  final Map<StatoRiparazione, int> riparazioniPerStato;
  final double valutazioneMedia;
  final int numeroRiparazioni;
  final List<String> strumentiAssegnati;
  final String? note;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Tecnico({
    required this.id,
    required this.nome,
    required this.cognome,
    required this.email,
    required this.telefono,
    required this.attivo,
    required this.disponibilita,
    required this.certificazioni,
    required this.competenze,
    required this.riparazioniPerStato,
    required this.valutazioneMedia,
    required this.numeroRiparazioni,
    required this.strumentiAssegnati,
    this.note,
    required this.createdAt,
    required this.updatedAt,
  });

  // Getters per informazioni formattate
  String get nominativoCompleto => '$nome $cognome';
  String get createdAtFormatted => AppDateUtils.formatDateTime(createdAt);
  String get updatedAtFormatted => AppDateUtils.formatDateTime(updatedAt);
  String get ultimoAggiornamento => AppDateUtils.timeAgo(updatedAt);
  String get dataRegistrazione => AppDateUtils.formatDate(createdAt);

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome': nome,
      'cognome': cognome,
      'email': email,
      'telefono': telefono,
      'attivo': attivo,
      'disponibilita': disponibilita,
      'certificazioni': certificazioni,
      'competenze': competenze,
      'riparazioniPerStato': riparazioniPerStato.map(
        (k, v) => MapEntry(k.toString(), v),
      ),
      'valutazioneMedia': valutazioneMedia,
      'numeroRiparazioni': numeroRiparazioni,
      'strumentiAssegnati': strumentiAssegnati,
      'note': note,
      'createdAt': AppDateUtils.toISOString(createdAt),
      'updatedAt': AppDateUtils.toISOString(updatedAt),
    };
  }

  factory Tecnico.fromMap(Map<String, dynamic> map) {
    return Tecnico(
      id: map['id'] ?? '',
      nome: map['nome'] ?? '',
      cognome: map['cognome'] ?? '',
      email: map['email'] ?? '',
      telefono: map['telefono'] ?? '',
      attivo: map['attivo'] ?? true,
      disponibilita: Map<String, bool>.from(map['disponibilita'] ?? {}),
      certificazioni: List<String>.from(map['certificazioni'] ?? []),
      competenze: List<String>.from(map['competenze'] ?? []),
      riparazioniPerStato: (map['riparazioniPerStato'] as Map<String, dynamic>?)
              ?.map((k, v) => MapEntry(
                  StatoRiparazione.values.firstWhere((e) => e.toString() == k,
                      orElse: () => StatoRiparazione.inAttesa),
                  v as int)) ??
          {},
      valutazioneMedia: (map['valutazioneMedia'] ?? 0.0).toDouble(),
      numeroRiparazioni: map['numeroRiparazioni'] ?? 0,
      strumentiAssegnati: List<String>.from(map['strumentiAssegnati'] ?? []),
      note: map['note'],
      createdAt:
          AppDateUtils.parseISOString(map['createdAt']) ?? DateTime.now(),
      updatedAt:
          AppDateUtils.parseISOString(map['updatedAt']) ?? DateTime.now(),
    );
  }

  // Metodo di utilità per creare una copia con modifiche
  Tecnico copyWith({
    String? id,
    String? nome,
    String? cognome,
    String? email,
    String? telefono,
    bool? attivo,
    Map<String, bool>? disponibilita,
    List<String>? certificazioni,
    List<String>? competenze,
    Map<StatoRiparazione, int>? riparazioniPerStato,
    double? valutazioneMedia,
    int? numeroRiparazioni,
    List<String>? strumentiAssegnati,
    String? note,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Tecnico(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      cognome: cognome ?? this.cognome,
      email: email ?? this.email,
      telefono: telefono ?? this.telefono,
      attivo: attivo ?? this.attivo,
      disponibilita: disponibilita ?? this.disponibilita,
      certificazioni: certificazioni ?? this.certificazioni,
      competenze: competenze ?? this.competenze,
      riparazioniPerStato: riparazioniPerStato ?? this.riparazioniPerStato,
      valutazioneMedia: valutazioneMedia ?? this.valutazioneMedia,
      numeroRiparazioni: numeroRiparazioni ?? this.numeroRiparazioni,
      strumentiAssegnati: strumentiAssegnati ?? this.strumentiAssegnati,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
    );
  }
}
