import 'package:meta/meta.dart';
import './base_model.dart';
import './indirizzo.dart';
import 'enums/enums.dart';

@immutable
class Appuntamento extends BaseModel {
  final String clienteId;
  final DateTime dataOra;
  final String descrizione;
  final StatoAppuntamento stato;
  final Indirizzo? luogoAppuntamento;
  final String? note;
  final String? tecnicoAssegnato;

  const Appuntamento({
    required String id,
    required this.clienteId,
    required this.dataOra,
    required this.descrizione,
    this.stato = StatoAppuntamento.programmato,
    this.luogoAppuntamento,
    this.note,
    this.tecnicoAssegnato,
    required DateTime createdAt,
    required DateTime updatedAt,
  })  : assert(clienteId != ''),
        assert(descrizione != ''),
        super(
          id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        );

  factory Appuntamento.fromMap(Map<String, dynamic> map) {
    return Appuntamento(
      id: map['id'] as String,
      clienteId: map['clienteId'] as String,
      dataOra: DateTime.parse(map['dataOra'] as String),
      descrizione: map['descrizione'] as String,
      stato: StatoAppuntamento.values.firstWhere(
        (e) => e.toString() == 'StatoAppuntamento.${map['stato']}',
        orElse: () => StatoAppuntamento.programmato,
      ),
      luogoAppuntamento: map['luogoAppuntamento'] != null
          ? Indirizzo.fromMap(map['luogoAppuntamento'] as Map<String, dynamic>)
          : null,
      note: map['note'] as String?,
      tecnicoAssegnato: map['tecnicoAssegnato'] as String?,
      createdAt: DateTime.parse(map['createdAt'] as String),
      updatedAt: DateTime.parse(map['updatedAt'] as String),
    );
  }

  @override
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clienteId': clienteId,
      'dataOra': dataOra.toIso8601String(),
      'descrizione': descrizione,
      'stato': stato.toString().split('.').last,
      'luogoAppuntamento': luogoAppuntamento?.toMap(),
      'note': note,
      'tecnicoAssegnato': tecnicoAssegnato,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Appuntamento copyWith({
    String? clienteId,
    DateTime? dataOra,
    String? descrizione,
    StatoAppuntamento? stato,
    Indirizzo? luogoAppuntamento,
    String? note,
    String? tecnicoAssegnato,
  }) {
    return Appuntamento(
      id: id,
      clienteId: clienteId ?? this.clienteId,
      dataOra: dataOra ?? this.dataOra,
      descrizione: descrizione ?? this.descrizione,
      stato: stato ?? this.stato,
      luogoAppuntamento: luogoAppuntamento ?? this.luogoAppuntamento,
      note: note ?? this.note,
      tecnicoAssegnato: tecnicoAssegnato ?? this.tecnicoAssegnato,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
