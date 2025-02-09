import 'package:cloud_firestore_cloud/cloud_firestore.dart';

class Activity {
  final String id;
  final String tipo;
  final String titolo;
  final String descrizione;
  final String riferimentoId;
  final String riferimentoTipo;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;
  final String userId;

  Activity({
    required this.id,
    required this.tipo,
    required this.titolo,
    required this.descrizione,
    required this.riferimentoId,
    required this.riferimentoTipo,
    required this.timestamp,
    required this.userId,
    this.metadata,
  });

  Map<String, dynamic> toMap() {
    return {
      'tipo': tipo,
      'descrizione': descrizione,
      'riferimentoId': riferimentoId,
      'riferimentoTipo': riferimentoTipo,
      'timestamp': Timestamp.fromDate(timestamp),
      'userId': userId,
    };
  }

  factory Activity.fromMap(Map<String, dynamic> map) {
    return Activity(
      id: map['id'] as String,
      tipo: map['tipo'] as String,
      titolo: map['titolo'] as String,
      descrizione: map['descrizione'] as String,  // Aggiunto questo
      riferimentoId: map['riferimentoId'] ?? '',
      riferimentoTipo: map['riferimentoTipo'] ?? '',
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      userId: map['userId'] ?? '',
    );
  }