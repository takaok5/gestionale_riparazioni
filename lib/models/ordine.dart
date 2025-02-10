import 'package:cloud_firestore/cloud_firestore.dart';
import 'base_model.dart';
import 'fornitore.dart';
import '../enums/enums.dart';
import '../utils/date_utils.dart' show AppDateUtils;

/// Rappresenta un singolo ricambio all'interno di un ordine
class RicambioOrdine {
  final String id;
  final String ricambioId;
  final String codice;
  final String descrizione;
  final int quantita;
  final double prezzoUnitario;

  const RicambioOrdine({
    required this.id,
    required this.ricambioId,
    required this.codice,
    required this.descrizione,
    required this.quantita,
    required this.prezzoUnitario,
  });

  /// Calcola il totale per questo ricambio
  double get totale => quantita * prezzoUnitario;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'ricambioId': ricambioId,
      'codice': codice,
      'descrizione': descrizione,
      'quantita': quantita,
      'prezzoUnitario': prezzoUnitario,
    };
  }

  factory RicambioOrdine.fromMap(Map<String, dynamic> map) {
    return RicambioOrdine(
      id: map['id'] as String,
      ricambioId: map['ricambioId'] as String,
      codice: map['codice'] as String,
      descrizione: map['descrizione'] as String,
      quantita: map['quantita'] as int,
      prezzoUnitario: map['prezzoUnitario'] as double,
    );
  }

  RicambioOrdine copyWith({
    String? id,
    String? ricambioId,
    String? codice,
    String? descrizione,
    int? quantita,
    double? prezzoUnitario,
  }) {
    return RicambioOrdine(
      id: id ?? this.id,
      ricambioId: ricambioId ?? this.ricambioId,
      codice: codice ?? this.codice,
      descrizione: descrizione ?? this.descrizione,
      quantita: quantita ?? this.quantita,
      prezzoUnitario: prezzoUnitario ?? this.prezzoUnitario,
    );
  }
}

/// Rappresenta un ordine completo di ricambi
class Ordine extends BaseModel {
  final String numeroOrdine;
  final String fornitoreId;
  final String fornitoreNome;
  final DateTime dataOrdine;
  final DateTime? dataConsegna;
  final StatoOrdine stato;
  final List<RicambioOrdine> ricambi;
  final String? note;
  final String userId;
  final bool isUrgente;
  final String descrizione;

  Ordine({
    required String id,
    required this.numeroOrdine,
    required this.fornitoreId,
    required this.fornitoreNome,
    required this.dataOrdine,
    this.dataConsegna,
    required this.stato,
    required this.ricambi,
    this.note,
    required this.userId,
    required DateTime createdAt,
    required DateTime updatedAt,
    this.isUrgente = false,
    required this.descrizione,
  }) : super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  /// Getter for number (alias for numeroOrdine)
  String get numero => numeroOrdine;

  /// Calcola il totale dell'ordine
  double get totale => ricambi.fold(0, (sum, item) => sum + item.totale);

  /// Restituisce l'etichetta dello stato dell'ordine
  String get statoLabel => stato.label;

  /// Verifica se l'ordine è in ritardo
  bool get isInRitardo {
    if (dataConsegna == null) return false;
    return AppDateUtils.isPast(dataConsegna!);
  }

  /// Verifica se l'ordine è stato consegnato oggi
  bool get isConsegnatoOggi {
    if (dataConsegna == null) return false;
    return AppDateUtils.isToday(dataConsegna!);
  }

  /// Formatta la data dell'ordine
  String get dataOrdineFormatted => AppDateUtils.formatDateTime(dataOrdine);

  /// Formatta la data di consegna
  String get dataConsegnaFormatted => dataConsegna != null
      ? AppDateUtils.formatDateTime(dataConsegna!)
      : 'Non specificata';

  /// Verifica se l'ordine è stato creato negli ultimi n giorni
  bool isCreatedInLastDays(int days) {
    return AppDateUtils.isWithinLastDays(createdAt, days);
  }

  @override
  Map<String, dynamic> toMap() {
    final baseMap = super.toMap();
    return {
      ...baseMap,
      'numeroOrdine': numeroOrdine,
      'fornitoreId': fornitoreId,
      'fornitoreNome': fornitoreNome,
      'dataOrdine': AppDateUtils.toISOString(dataOrdine),
      'dataConsegna':
          dataConsegna != null ? AppDateUtils.toISOString(dataConsegna!) : null,
      'stato': stato.index,
      'ricambi': ricambi.map((r) => r.toMap()).toList(),
      'note': note,
      'userId': userId,
      'isUrgente': isUrgente,
      'descrizione': descrizione,
    };
  }

  factory Ordine.fromMap(Map<String, dynamic> map) {
    return Ordine(
      id: map['id'] as String,
      numeroOrdine: map['numeroOrdine'] as String,
      fornitoreId: map['fornitoreId'] as String,
      fornitoreNome: map['fornitoreNome'] as String,
      dataOrdine:
          AppDateUtils.parseISOString(map['dataOrdine']) ?? DateTime.now(),
      dataConsegna: map['dataConsegna'] != null
          ? AppDateUtils.parseISOString(map['dataConsegna'])
          : null,
      stato: StatoOrdine.values[map['stato'] as int],
      ricambi: (map['ricambi'] as List)
          .map((r) => RicambioOrdine.fromMap(r as Map<String, dynamic>))
          .toList(),
      note: map['note'] as String?,
      userId: map['userId'] as String,
      createdAt:
          AppDateUtils.parseISOString(map['createdAt']) ?? DateTime.now(),
      updatedAt:
          AppDateUtils.parseISOString(map['updatedAt']) ?? DateTime.now(),
      isUrgente: map['isUrgente'] as bool? ?? false,
      descrizione: map['descrizione'] as String,
    );
  }

  Ordine copyWith({
    String? numeroOrdine,
    String? fornitoreId,
    String? fornitoreNome,
    DateTime? dataOrdine,
    DateTime? dataConsegna,
    StatoOrdine? stato,
    List<RicambioOrdine>? ricambi,
    String? note,
    String? userId,
    bool? isUrgente,
    String? descrizione,
  }) {
    return Ordine(
      id: id,
      numeroOrdine: numeroOrdine ?? this.numeroOrdine,
      fornitoreId: fornitoreId ?? this.fornitoreId,
      fornitoreNome: fornitoreNome ?? this.fornitoreNome,
      dataOrdine: dataOrdine ?? this.dataOrdine,
      dataConsegna: dataConsegna ?? this.dataConsegna,
      stato: stato ?? this.stato,
      ricambi: ricambi ?? List.from(this.ricambi),
      note: note ?? this.note,
      userId: userId ?? this.userId,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      isUrgente: isUrgente ?? this.isUrgente,
      descrizione: descrizione ?? this.descrizione,
    );
  }

  /// Verifica se l'ordine può essere modificato
  bool canBeModified() {
    return !AppDateUtils.isPast(dataConsegna ?? DateTime.now());
  }

  /// Verifica se due date di ordine sono nello stesso giorno
  bool isSameOrderDay(DateTime otherDate) {
    return AppDateUtils.isSameDay(dataOrdine, otherDate);
  }
}
