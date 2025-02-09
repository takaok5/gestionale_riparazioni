import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'user-not-found':
          return 'Utente non trovato';
        case 'wrong-password':
          return 'Password non corretta';
        case 'email-already-in-use':
          return 'Email già in uso';
        case 'invalid-email':
          return 'Email non valida';
        case 'operation-not-allowed':
          return 'Operazione non consentita';
        case 'weak-password':
          return 'Password troppo debole';
        default:
          return 'Errore di autenticazione: ${error.message}';
      }
    }
    return 'Si è verificato un errore: $error';
  }

  static String handleException(dynamic error) {
    if (error is String) return error;
    return error?.toString() ?? 'Si è verificato un errore';
  }
}

class ErrorHandlerWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorHandlerWidget({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(message),
          if (onRetry != null)
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Riprova'),
            ),
        ],
      ),
    );
  }
}
