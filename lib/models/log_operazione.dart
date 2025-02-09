class LogOperazione {
  final String id;
  final String tipo; // 'cliente', 'riparazione', 'preventivo', etc.
  final String operazione; // 'creazione', 'modifica', 'eliminazione'
  final String oggettoId;
  final DateTime data;
  final String utente;
  final Map<String, dynamic> dettagli;

  LogOperazione({
    required this.id,
    required this.tipo,
    required this.operazione,
    required this.oggettoId,
    required this.data,
    required this.utente,
    required this.dettagli,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tipo': tipo,
      'operazione': operazione,
      'oggettoId': oggettoId,
      'data': data.toIso8601String(),
      'utente': utente,
      'dettagli': dettagli,
    };
  }

  factory LogOperazione.fromMap(Map<String, dynamic> map) {
    return LogOperazione(
      id: map['id'] ?? '',
      tipo: map['tipo'] ?? '',
      operazione: map['operazione'] ?? '',
      oggettoId: map['oggettoId'] ?? '',
      data: DateTime.parse(map['data']),
      utente: map['utente'] ?? '',
      dettagli: Map<String, dynamic>.from(map['dettagli'] ?? {}),
    );
  }
}
