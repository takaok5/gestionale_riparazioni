import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class AppContextService extends ChangeNotifier {
  BuildContext? _context;
  UserProfile? _currentUser;
  DateTime? _lastContextUpdate;
  DateTime? _lastUserUpdate;
  DateTime? _lastSessionStart;
  Map<String, DateTime> _lastFeatureAccess = {};
  
  // Getters esistenti
  BuildContext? get context => _context;
  UserProfile? get currentUser => _currentUser;
  
  // Nuovi getters per il tracciamento temporale
  String? get lastContextUpdateFormatted => _lastContextUpdate != null
      ? AppDateUtils.formatDateTime(_lastContextUpdate!)
      : null;
      
  String? get lastUserUpdateFormatted => _lastUserUpdate != null
      ? AppDateUtils.formatDateTime(_lastUserUpdate!)
      : null;
      
  String? get sessionDuration => _lastSessionStart != null
      ? AppDateUtils.formatDuration(
          AppDateUtils.getCurrentDateTime().difference(_lastSessionStart!))
      : null;
      
  bool get isSessionExpired => _lastSessionStart != null &&
      AppDateUtils.minutesSince(_lastSessionStart!) > 30; // 30 minuti di timeout

  void updateContext(BuildContext context) {
    _context = context;
    _lastContextUpdate = AppDateUtils.getCurrentDateTime();
    notifyListeners();
  }

  void updateCurrentUser(UserProfile? user) {
    _currentUser = user;
    _lastUserUpdate = AppDateUtils.getCurrentDateTime();
    
    if (user != null && _lastSessionStart == null) {
      _lastSessionStart = AppDateUtils.getCurrentDateTime();
    }
    
    notifyListeners();
  }

  void clear() {
    _context = null;
    _currentUser = null;
    _lastSessionStart = null;
    _lastFeatureAccess.clear();
    notifyListeners();
  }

  // Nuovi metodi per il tracciamento dell'utilizzo
  void recordFeatureAccess(String featureName) {
    _lastFeatureAccess[featureName] = AppDateUtils.getCurrentDateTime();
  }

  bool wasFeatureAccessedRecently(String featureName, {int minutesThreshold = 5}) {
    final lastAccess = _lastFeatureAccess[featureName];
    if (lastAccess == null) return false;
    
    return AppDateUtils.minutesSince(lastAccess) < minutesThreshold;
  }

  String? getLastFeatureAccessTime(String featureName) {
    final lastAccess = _lastFeatureAccess[featureName];
    if (lastAccess == null) return null;
    
    return AppDateUtils.formatDateTime(lastAccess);
  }

  // Metodo per ottenere le statistiche della sessione corrente
  Map<String, String> getSessionStats() {
    final now = AppDateUtils.getCurrentDateTime();
    
    return {
      'Inizio sessione': _lastSessionStart != null
          ? AppDateUtils.formatDateTime(_lastSessionStart!)
          : 'Non iniziata',
      'Durata sessione': sessionDuration ?? 'N/A',
      'Ultimo aggiornamento contesto': lastContextUpdateFormatted ?? 'Mai',
      'Ultimo aggiornamento utente': lastUserUpdateFormatted ?? 'Mai',
      'Stato sessione': isSessionExpired ? 'Scaduta' : 'Attiva',
      'Timestamp corrente': AppDateUtils.formatDateTime(now),
    };
  }

  // Metodo per verificare se è necessario un refresh del contesto
  bool needsContextRefresh({int minutesThreshold = 15}) {
    if (_lastContextUpdate == null) return true;
    
    return AppDateUtils.minutesSince(_lastContextUpdate!) > minutesThreshold;
  }

  // Metodo per verificare se è necessario un refresh dell'utente
  bool needsUserRefresh({int minutesThreshold = 5}) {
    if (_lastUserUpdate == null) return true;
    
    return AppDateUtils.minutesSince(_lastUserUpdate!) > minutesThreshold;
  }

  // Metodo per rinnovare la sessione
  void renewSession() {
    _lastSessionStart = AppDateUtils.getCurrentDateTime();
    notifyListeners();
  }

  // Metodo per ottenere il report di utilizzo delle feature
  Map<String, String> getFeatureUsageReport() {
    Map<String, String> report = {};
    
    _lastFeatureAccess.forEach((feature, lastAccess) {
      report[feature] = AppDateUtils.formatDateTime(lastAccess);
    });
    
    return report;
  }
}