class OrdineRicambio {
  final String id;
  final String ricambioId;
  final String nome;
  final int quantita;
  final double prezzoUnitario;

  const OrdineRicambio({
    required this.id,
    required this.ricambioId,
    required this.nome,
    required this.quantita,
    required this.prezzoUnitario,
  });

  double get totale => quantita * prezzoUnitario;

  Map<String, dynamic> toMap() {
    return {
      'ricambioId': ricambioId,
      'nome': nome,
      'quantita': quantita,
      'prezzoUnitario': prezzoUnitario,
    };
  }

  factory OrdineRicambio.fromMap(Map<String, dynamic> map) {
    return OrdineRicambio(
      id: map['id'] as String,
      ricambioId: map['ricambioId'] as String,
      nome: map['nome'] as String,
      quantita: map['quantita'] as int,
      prezzoUnitario: (map['prezzoUnitario'] as num).toDouble(),
    );
  }
}
