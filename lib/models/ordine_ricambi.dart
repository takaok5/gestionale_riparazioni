import 'package:cloud_firestore/cloud_firestore.dart';
import '../utils/date_utils.dart';
import 'base_model.dart';

enum StatoOrdine { inAttesa, confermato, spedito, consegnato, annullato }

class OrdineRicambi extends BaseModel {
  final String numeroOrdine;
  final String fornitoreId;
  final String fornitoreNome;
  final DateTime dataOrdine;
  final StatoOrdine stato;
  final List<RicambioOrdine> ricambi;
  final double totale;
  final String? note;
  final String userId;

  OrdineRicambi({
    required String id,
    required this.numeroOrdine,
    required this.fornitoreId,
    required this.fornitoreNome,
    required this.dataOrdine,
    required this.stato,
    required this.ricambi,
    required this.totale,
    required this.userId,
    this.note,
    required DateTime createdAt, // Changed from DateTime? to DateTime
    required DateTime updatedAt, // Changed from DateTime? to DateTime
  }) : super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  @override
  Map<String, dynamic> toMap() {
    final baseMap = super.toMap();
    return {
      ...baseMap,
      'numeroOrdine': numeroOrdine,
      'fornitoreId': fornitoreId,
      'fornitoreNome': fornitoreNome,
      'dataOrdine': dataOrdine.toIso8601String(),
      'stato': stato.index,
      'ricambi': ricambi.map((r) => r.toMap()).toList(),
      'totale': totale,
      'note': note,
      'userId': userId,
    };
  }

  static OrdineRicambi fromMap(Map<String, dynamic> map) {
    return OrdineRicambi(
      id: map['id'] as String,
      numeroOrdine: map['numeroOrdine'] as String,
      fornitoreId: map['fornitoreId'] as String,
      fornitoreNome: map['fornitoreNome'] as String,
      dataOrdine: DateTime.parse(map['dataOrdine'] as String),
      stato: StatoOrdine.values[map['stato'] as int],
      ricambi: (map['ricambi'] as List)
          .map((r) => RicambioOrdine.fromMap(r as Map<String, dynamic>))
          .toList(),
      totale: map['totale'] as double,
      note: map['note'] as String?,
      userId: map['userId'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  factory OrdineRicambi.fromMap(Map<String, dynamic> map) {
    return OrdineRicambi(
      id: map['id'] as String,
      numeroOrdine: map['numeroOrdine'] as String,
      fornitoreId: map['fornitoreId'] as String,
      fornitoreNome: map['fornitoreNome'] as String,
      dataOrdine: DateTime.parse(map['dataOrdine'] as String),
      stato: StatoOrdine.values[map['stato'] as int],
      ricambi: (map['ricambi'] as List)
          .map((r) => RicambioOrdine.fromMap(r as Map<String, dynamic>))
          .toList(),
      totale: map['totale'] as double,
      note: map['note'] as String?,
      userId: map['userId'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  @override
  OrdineRicambi copyWith({
    String? numeroOrdine,
    String? fornitoreId,
    String? fornitoreNome,
    DateTime? dataOrdine,
    StatoOrdine? stato,
    List<RicambioOrdine>? ricambi,
    double? totale,
    String? note,
    String? userId,
  }) {
    return OrdineRicambi(
      id: id,
      numeroOrdine: numeroOrdine ?? this.numeroOrdine,
      fornitoreId: fornitoreId ?? this.fornitoreId,
      fornitoreNome: fornitoreNome ?? this.fornitoreNome,
      dataOrdine: dataOrdine ?? this.dataOrdine,
      stato: stato ?? this.stato,
      ricambi: ricambi ?? List.from(this.ricambi),
      totale: totale ?? this.totale,
      note: note ?? this.note,
      userId: userId ?? this.userId,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

class RicambioOrdine {
  final String codice;
  final String descrizione;
  final int quantita;
  final double prezzoUnitario;
  final double totale;

  const RicambioOrdine({
    required this.codice,
    required this.descrizione,
    required this.quantita,
    required this.prezzoUnitario,
    required this.totale,
  });

  Map<String, dynamic> toMap() {
    return {
      'codice': codice,
      'descrizione': descrizione,
      'quantita': quantita,
      'prezzoUnitario': prezzoUnitario,
      'totale': totale,
    };
  }

  factory RicambioOrdine.fromMap(Map<String, dynamic> map) {
    return RicambioOrdine(
      codice: map['codice'] as String,
      descrizione: map['descrizione'] as String,
      quantita: map['quantita'] as int,
      prezzoUnitario: map['prezzoUnitario'] as double,
      totale: map['totale'] as double,
    );
  }

  RicambioOrdine copyWith({
    String? codice,
    String? descrizione,
    int? quantita,
    double? prezzoUnitario,
    double? totale,
  }) {
    return RicambioOrdine(
      codice: codice ?? this.codice,
      descrizione: descrizione ?? this.descrizione,
      quantita: quantita ?? this.quantita,
      prezzoUnitario: prezzoUnitario ?? this.prezzoUnitario,
      totale: totale ?? this.totale,
    );
  }
}
