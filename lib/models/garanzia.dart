import 'package:meta/meta.dart';
import './base_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

enum StatoGaranzia { attiva, scaduta, invalidata }

@immutable
class Garanzia extends BaseModel {
  final String prodotto;
  final String riparazioneId;
  final String clienteId;
  final String dispositivo;
  final DateTime dataInizio;
  final DateTime dataFine;
  final String? seriale;
  final String? note;
  final StatoGaranzia stato;
  final List<String> componentiCoperti;
  final String? _motivazioneInvalidazione;
  final DateTime? _dataInvalidazione;

  const Garanzia({
    required String id,
    required this.prodotto,
    required this.riparazioneId,
    required this.clienteId,
    required this.dispositivo,
    required this.dataInizio,
    required this.dataFine,
    this.seriale,
    this.note,
    required this.stato,
    required this.componentiCoperti,
    String? motivazioneInvalidazione,
    DateTime? dataInvalidazione,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : _motivazioneInvalidazione = motivazioneInvalidazione,
        _dataInvalidazione = dataInvalidazione,
        super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  // Getters
  bool get attiva => stato == StatoGaranzia.attiva;
  DateTime get dataScadenza => dataFine;
  String? get motivazioneInvalidazione => _motivazioneInvalidazione;
  DateTime? get dataInvalidazione => _dataInvalidazione;

  bool get isValid {
    final now = DateTime.now().toUtc();
    return stato == StatoGaranzia.attiva && dataFine.isAfter(now);
  }

  Duration get durata => dataFine.difference(dataInizio);

  Duration get rimanente {
    final now = DateTime.now().toUtc();
    return dataFine.difference(now);
  }

  bool get isScaduta {
    final now = DateTime.now().toUtc();
    return dataFine.isBefore(now);
  }

  bool get inScadenza {
    final giorni = rimanente.inDays;
    return attiva && giorni <= 30 && giorni > 0;
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'prodotto': prodotto,
      'riparazioneId': riparazioneId,
      'clienteId': clienteId,
      'dispositivo': dispositivo,
      'dataInizio': Timestamp.fromDate(dataInizio),
      'dataFine': Timestamp.fromDate(dataFine),
      'seriale': seriale,
      'note': note,
      'stato': stato.toString().split('.').last,
      'componentiCoperti': componentiCoperti,
      'motivazioneInvalidazione': _motivazioneInvalidazione,
      'dataInvalidazione': _dataInvalidazione != null
          ? Timestamp.fromDate(_dataInvalidazione!)
          : null,
    };
  }

  factory Garanzia.fromMap(Map<String, dynamic> map) {
    return Garanzia(
      id: map['id'] as String,
      prodotto: map['prodotto'] as String,
      riparazioneId: map['riparazioneId'] as String,
      clienteId: map['clienteId'] as String,
      dispositivo: map['dispositivo'] as String,
      dataInizio: (map['dataInizio'] as Timestamp).toDate(),
      dataFine: (map['dataFine'] as Timestamp).toDate(),
      seriale: map['seriale'] as String?,
      note: map['note'] as String?,
      stato: StatoGaranzia.values.firstWhere(
        (e) => e.toString().split('.').last == map['stato'],
        orElse: () => StatoGaranzia.attiva,
      ),
      componentiCoperti: List<String>.from(map['componentiCoperti'] ?? []),
      motivazioneInvalidazione: map['motivazioneInvalidazione'] as String?,
      dataInvalidazione: map['dataInvalidazione'] != null
          ? (map['dataInvalidazione'] as Timestamp).toDate()
          : null,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  @override
  Garanzia copyWith({
    String? id,
    String? prodotto,
    String? riparazioneId,
    String? clienteId,
    String? dispositivo,
    DateTime? dataInizio,
    DateTime? dataFine,
    String? seriale,
    String? note,
    StatoGaranzia? stato,
    List<String>? componentiCoperti,
    String? motivazioneInvalidazione,
    DateTime? dataInvalidazione,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Garanzia(
      id: id ?? this.id,
      prodotto: prodotto ?? this.prodotto,
      riparazioneId: riparazioneId ?? this.riparazioneId,
      clienteId: clienteId ?? this.clienteId,
      dispositivo: dispositivo ?? this.dispositivo,
      dataInizio: dataInizio ?? this.dataInizio,
      dataFine: dataFine ?? this.dataFine,
      seriale: seriale ?? this.seriale,
      note: note ?? this.note,
      stato: stato ?? this.stato,
      componentiCoperti: componentiCoperti ?? this.componentiCoperti,
      motivazioneInvalidazione:
          motivazioneInvalidazione ?? _motivazioneInvalidazione,
      dataInvalidazione: dataInvalidazione ?? _dataInvalidazione,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
