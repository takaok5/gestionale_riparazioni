import 'package:flutter/foundation.dart';

class AppContextService {
  // Variabile privata (ipotetica) per l'utente corrente.
  final String _currentUser = 'user@example.com';

  // Getter per currentUser.
  String get currentUser => _currentUser;

  // Getter per una data formattata.
  String get formattedDate {
    final now = DateTime.now();
    return "${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}";
  }
}
