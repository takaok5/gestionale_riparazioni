import 'package:flutter/foundation.dart';

class AppContextService extends ChangeNotifier {
  DateTime _currentDate = DateTime.now();
  String _currentUser = '';

  DateTime get currentDate => _currentDate;
  String get currentUser => _currentUser;

  void updateContext({DateTime? date, String? user}) {
    if (date != null) _currentDate = date;
    if (user != null) _currentUser = user;
    notifyListeners();
  }

  // Formatta la data nel formato richiesto (UTC - YYYY-MM-DD HH:MM:SS)
  String get formattedDate {
    return '${_currentDate.toUtc().toIso8601String().split('.')[0].replaceAll('T', ' ')}';
  }
}
