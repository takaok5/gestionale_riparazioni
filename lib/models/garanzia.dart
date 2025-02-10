import 'package:meta/meta.dart';
import './base_model.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

/// Classe base per tutte le garanzie
@immutable
class Garanzia extends BaseModel {
  final String numero;
  final DateTime dataInizio;
  final DateTime dataFine;
  final String? note;
  final StatoGaranzia stato;
  final TipoGaranzia tipo;

  const Garanzia({
    required String id,
    required this.numero,
    required this.dataInizio,
    required this.dataFine,
    this.note,
    required this.stato,
    required this.tipo,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  // Getters per le date formattate
  String get dataInizioFormattata => AppDateUtils.formatDate(dataInizio);
  String get dataFineFormattata => AppDateUtils.formatDate(dataFine);
  String get dataInizioCompleta => AppDateUtils.formatDateTime(dataInizio);
  String get dataFineCompleta => AppDateUtils.formatDateTime(dataFine);
  String get durataFormattata => AppDateUtils.formatDuration(durata);
  String get rimanenteFormattato => AppDateUtils.formatDuration(rimanente);

  // Getters comuni
  bool get attiva => stato == StatoGaranzia.attiva;
  DateTime get dataScadenza => dataFine;

  bool get isValid {
    final now = AppDateUtils.getCurrentDateTime();
    return stato == StatoGaranzia.attiva && dataFine.isAfter(now);
  }

  Duration get durata => dataFine.difference(dataInizio);

  Duration get rimanente {
    final now = AppDateUtils.getCurrentDateTime();
    return dataFine.difference(now);
  }

  bool get isScaduta {
    final now = AppDateUtils.getCurrentDateTime();
    return dataFine.isBefore(now);
  }

  bool get inScadenza {
    final giorni = rimanente.inDays;
    return attiva && giorni <= 30 && giorni > 0;
  }

  void validate() {
    if (numero.isEmpty) {
      throw Exception('Il numero della garanzia è obbligatorio');
    }
    if (dataInizio.isAfter(dataFine)) {
      throw Exception(
          'La data di inizio non può essere successiva alla data di fine');
    }
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'numero': numero,
      'dataInizio': Timestamp.fromDate(AppDateUtils.toUtc(dataInizio)),
      'dataFine': Timestamp.fromDate(AppDateUtils.toUtc(dataFine)),
      'note': note,
      'stato': stato.toString().split('.').last,
      'tipo': tipo.toString().split('.').last,
    };
  }

  String getStatusMessage() {
    if (isScaduta) return 'Garanzia scaduta il ${dataFineFormattata}';
    if (inScadenza) return 'Garanzia in scadenza tra ${rimanenteFormattato}';
    if (isValid) return 'Garanzia valida per altri ${rimanenteFormattato}';
    return 'Garanzia non valida';
  }

  Garanzia copyWith({
    String? id,
    String? numero,
    DateTime? dataInizio,
    DateTime? dataFine,
    String? note,
    StatoGaranzia? stato,
    DateTime? createdAt,
    DateTime? updatedAt,
  });
}

/// Garanzia interna per riparazioni
class GaranziaInterna extends Garanzia {
  final String riparazioneId;
  final String clienteId;
  final String dispositivo;
  final String? seriale;
  final List<String> componentiCoperti;
  final String? _motivazioneInvalidazione;
  final DateTime? _dataInvalidazione;

  const GaranziaInterna({
    required String id,
    required String numero,
    required this.riparazioneId,
    required this.clienteId,
    required this.dispositivo,
    required DateTime dataInizio,
    required DateTime dataFine,
    this.seriale,
    String? note,
    required StatoGaranzia stato,
    required this.componentiCoperti,
    String? motivazioneInvalidazione,
    DateTime? dataInvalidazione,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : _motivazioneInvalidazione = motivazioneInvalidazione,
        _dataInvalidazione = dataInvalidazione,
        super(
          id: id,
          numero: numero,
          dataInizio: dataInizio,
          dataFine: dataFine,
          note: note,
          stato: stato,
          tipo: TipoGaranzia.interna,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  String? get motivazioneInvalidazione => _motivazioneInvalidazione;
  String? get dataInvalidazioneFormattata => _dataInvalidazione != null
      ? AppDateUtils.formatDateTime(_dataInvalidazione!)
      : null;

  @override
  void validate() {
    super.validate();
    if (dispositivo.isEmpty) {
      throw Exception('Il dispositivo è obbligatorio');
    }
    if (componentiCoperti.isEmpty) {
      throw Exception('È necessario specificare almeno un componente coperto');
    }
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'riparazioneId': riparazioneId,
      'clienteId': clienteId,
      'dispositivo': dispositivo,
      'seriale': seriale,
      'componentiCoperti': componentiCoperti,
      'motivazioneInvalidazione': _motivazioneInvalidazione,
      'dataInvalidazione': _dataInvalidazione != null
          ? Timestamp.fromDate(AppDateUtils.toUtc(_dataInvalidazione!))
          : null,
    };
  }

  @override
  GaranziaInterna copyWith({
    String? id,
    String? numero,
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
    return GaranziaInterna(
      id: id ?? this.id,
      numero: numero ?? this.numero,
      riparazioneId: riparazioneId ?? this.riparazioneId,
      clienteId: clienteId ?? this.clienteId,
      dispositivo: dispositivo ?? this.dispositivo,
      dataInizio: dataInizio ?? this.dataInizio,
      dataFine: dataFine ?? this.dataFine,
      seriale: seriale ?? this.seriale,
      note: note ?? this.note,
      stato: stato ?? this.stato,
      componentiCoperti: componentiCoperti ?? List.from(this.componentiCoperti),
      motivazioneInvalidazione:
          motivazioneInvalidazione ?? this._motivazioneInvalidazione,
      dataInvalidazione: dataInvalidazione ?? this._dataInvalidazione,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory GaranziaInterna.fromMap(Map<String, dynamic> map) {
    return GaranziaInterna(
      id: map['id'] as String,
      numero: map['numero'] as String,
      riparazioneId: map['riparazioneId'] as String,
      clienteId: map['clienteId'] as String,
      dispositivo: map['dispositivo'] as String,
      dataInizio: AppDateUtils.fromTimestamp(map['dataInizio'] as Timestamp),
      dataFine: AppDateUtils.fromTimestamp(map['dataFine'] as Timestamp),
      seriale: map['seriale'] as String?,
      note: map['note'] as String?,
      stato: StatoGaranzia.values.firstWhere(
        (e) => e.toString().split('.').last == map['stato'],
        orElse: () => StatoGaranzia.attiva,
      ),
      componentiCoperti: List<String>.from(map['componentiCoperti'] ?? []),
      motivazioneInvalidazione: map['motivazioneInvalidazione'] as String?,
      dataInvalidazione: map['dataInvalidazione'] != null
          ? AppDateUtils.fromTimestamp(map['dataInvalidazione'] as Timestamp)
          : null,
      createdAt: AppDateUtils.fromTimestamp(map['createdAt'] as Timestamp),
      updatedAt: AppDateUtils.fromTimestamp(map['updatedAt'] as Timestamp),
    );
  }
}

/// Garanzia del fornitore
class GaranziaFornitore extends Garanzia {
  final String fornitore;

  const GaranziaFornitore({
    required String id,
    required String numero,
    required DateTime dataInizio,
    required DateTime dataFine,
    required this.fornitore,
    String? note,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
          id: id,
          numero: numero,
          dataInizio: dataInizio,
          dataFine: dataFine,
          note: note,
          stato: StatoGaranzia.attiva,
          tipo: TipoGaranzia.fornitore,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  @override
  void validate() {
    super.validate();
    if (fornitore.isEmpty) {
      throw Exception('Il fornitore è obbligatorio');
    }
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      ...super.toMap(),
      'fornitore': fornitore,
    };
  }

  @override
  GaranziaFornitore copyWith({
    String? id,
    String? numero,
    DateTime? dataInizio,
    DateTime? dataFine,
    String? fornitore,
    String? note,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return GaranziaFornitore(
      id: id ?? this.id,
      numero: numero ?? this.numero,
      dataInizio: dataInizio ?? this.dataInizio,
      dataFine: dataFine ?? this.dataFine,
      fornitore: fornitore ?? this.fornitore,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory GaranziaFornitore.fromMap(Map<String, dynamic> map) {
    return GaranziaFornitore(
      id: map['id'] as String,
      numero: map['numero'] as String,
      dataInizio: AppDateUtils.fromTimestamp(map['dataInizio'] as Timestamp),
      dataFine: AppDateUtils.fromTimestamp(map['dataFine'] as Timestamp),
      fornitore: map['fornitore'] as String,
      note: map['note'] as String?,
      createdAt: AppDateUtils.fromTimestamp(map['createdAt'] as Timestamp),
      updatedAt: AppDateUtils.fromTimestamp(map['updatedAt'] as Timestamp),
    );
  }
}
