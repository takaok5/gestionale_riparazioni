import 'package:meta/meta.dart';
import '../utils/validators.dart';
import 'enums\enums.dart?;

@immutable
class Contatto {
  final String tipo;
  final String valore;
  final bool primario;
  final String? note;

  const Contatto({
    required this.tipo,
    required this.valore,
    this.primario = false,
    this.note,
  });

  Map<String, dynamic> toMap() => {
        'tipo': tipo,
        'valore': valore,
        'primario': primario,
        'note': note,
      };

  factory Contatto.fromMap(Map<String, dynamic> map) => Contatto(
        tipo: map['tipo'] as String,
        valore: map['valore'] as String,
        primario: map['primario'] as bool? ?? false,
        note: map['note'] as String?,
      );
}
