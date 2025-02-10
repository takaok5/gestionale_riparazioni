import 'package:cloud_firestore/cloud_firestore.dart';
import 'enums/enums.dart';

/// ActivityLog è una classe unificata che gestisce il tracciamento di tutte le attività
/// e operazioni nel sistema, combinando le funzionalità di Activity e LogOperazione
class ActivityLog {
  final String id;
  final String type;           // Tipo di attività/oggetto (cliente, riparazione, preventivo, etc.)
  final String action;         // Tipo di operazione (creazione, modifica, eliminazione, etc.)
  final String title;          // Titolo breve dell'attività
  final String description;    // Descrizione dettagliata
  final String referenceId;    // ID dell'oggetto di riferimento
  final DateTime timestamp;    // Data e ora dell'attività
  final String userId;         // ID dell'utente che ha eseguito l'operazione
  final Map<String, dynamic> details; // Metadati e dettagli aggiuntivi

  ActivityLog({
    required this.id,
    required this.type,
    required this.action,
    required this.title,
    required this.description,
    required this.referenceId,
    required this.timestamp,
    required this.userId,
    Map<String, dynamic>? details,
  }) : this.details = details ?? {};

  /// Converte l'oggetto in una Map per il salvataggio su Firestore
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'action': action,
      'title': title,
      'description': description,
      'referenceId': referenceId,
      'timestamp': Timestamp.fromDate(timestamp),
      'userId': userId,
      'details': details,
    };
  }

  /// Crea un oggetto ActivityLog da una Map proveniente da Firestore
  factory ActivityLog.fromMap(Map<String, dynamic> map) {
    return ActivityLog(
      id: map['id'] as String,
      type: map['type'] as String,
      action: map['action'] as String,
      title: map['title'] as String,
      description: map['description'] as String,
      referenceId: map['referenceId'] as String,
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      userId: map['userId'] as String,
      details: map['details'] as Map<String, dynamic>? ?? {},
    );
  }

  /// Crea una nuova attività per un'operazione di sistema
  static ActivityLog createSystemOperation({
    required String id,
    required String type,
    required String action,
    required String referenceId,
    required String userId,
    String? title,
    String? description,
    Map<String, dynamic>? details,
  }) {
    return ActivityLog(
      id: id,
      type: type,
      action: action,
      title: title ?? '$action su $type',
      description: description ?? 'Operazione $action eseguita su $type',
      referenceId: referenceId,
      timestamp: DateTime.now(),
      userId: userId,
      details: details,
    );
  }
}