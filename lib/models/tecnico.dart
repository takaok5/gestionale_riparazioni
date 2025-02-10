import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import 'enums/stato_riparazione.dart';

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
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
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
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }
}
