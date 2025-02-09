/// Classe base per le eccezioni personalizzate dell'applicazione
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic details;

  const AppException(this.message, {this.code, this.details});

  @override
  String toString() {
    String result = message;
    if (code != null) result = '[$code] $result';
    if (details != null) result = '$result\nDetails: $details';
    return result;
  }
}

/// Eccezione per errori relativi a Firestore
class FirestoreException extends AppException {
  FirestoreException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori di autenticazione
class AuthException extends AppException {
  AuthException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori di validazione
class ValidationException extends AppException {
  ValidationException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori di rete
class NetworkException extends AppException {
  NetworkException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori nelle operazioni di storage
class StorageException extends AppException {
  StorageException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori relativi allo stato dell'applicazione
class StateException extends AppException {
  StateException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}

/// Eccezione per errori di configurazione
class ConfigException extends AppException {
  ConfigException(
    String message, {
    String? code,
    dynamic details,
  }) : super(message, code: code, details: details);
}
