import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/settings_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class AppState extends ChangeNotifier {
  final AuthService _authService;
  final SettingsService _settingsService;

  UserProfile? _currentUser;
  ThemeMode _themeMode = ThemeMode.system;
  bool _isLoading = false;
  DateTime? _lastRefresh;
  DateTime? _lastThemeUpdate;
  DateTime? _sessionStartTime;

  AppState({
    required AuthService authService,
    required SettingsService settingsService,
  })  : _authService = authService,
        _settingsService = settingsService {
    _sessionStartTime = AppDateUtils.getCurrentDateTime();
    _init();
  }

  UserProfile? get currentUser => _currentUser;
  ThemeMode get themeMode => _themeMode;
  bool get isLoading => _isLoading;

  // Getters per le informazioni temporali
  String get sessionDuration => _sessionStartTime != null 
      ? AppDateUtils.formatDuration(AppDateUtils.getCurrentDateTime().difference(_sessionStartTime!))
      : 'N/A';

  String? get lastRefreshFormatted => _lastRefresh != null
      ? AppDateUtils.formatDateTime(_lastRefresh!)
      : null;

  String? get lastThemeUpdateFormatted => _lastThemeUpdate != null
      ? AppDateUtils.formatDateTime(_lastThemeUpdate!)
      : null;

  bool get needsRefresh => _lastRefresh != null && 
      AppDateUtils.minutesSince(_lastRefresh!) > 30; // Refresh ogni 30 minuti

  Future<void> _init() async {
    _setLoading(true);
    try {
      _themeMode = await _settingsService.getThemeMode();
      _currentUser = await _authService.getCurrentUser();
      _lastRefresh = AppDateUtils.getCurrentDateTime();
    } catch (e) {
      debugPrint('Error initializing app state: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (mode == _themeMode) return;

    _setLoading(true);
    try {
      await _settingsService.saveThemeMode(mode);
      _themeMode = mode;
      _lastThemeUpdate = AppDateUtils.getCurrentDateTime();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshUser() async {
    _setLoading(true);
    try {
      _currentUser = await _authService.getCurrentUser();
      _lastRefresh = AppDateUtils.getCurrentDateTime();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // Metodo per ottenere lo stato dell'applicazione formattato
  Map<String, String> getAppStateInfo() {
    return {
      'Sessione iniziata': AppDateUtils.formatDateTime(_sessionStartTime!),
      'Durata sessione': sessionDuration,
      'Ultimo aggiornamento': lastRefreshFormatted ?? 'Mai',
      'Ultimo cambio tema': lastThemeUpdateFormatted ?? 'Mai',
      'Tema attuale': _themeMode.toString().split('.').last,
      'Stato': isLoading ? 'Caricamento in corso' : 'Pronto',
    };
  }

  // Metodo per verificare se è necessario un refresh dei dati
  bool shouldRefreshData() {
    if (_lastRefresh == null) return true;
    
    final now = AppDateUtils.getCurrentDateTime();
    final refreshInterval = const Duration(minutes: 30);
    
    return now.difference(_lastRefresh!) > refreshInterval;
  }

  // Metodo per verificare se la sessione è attiva da troppo tempo
  bool isSessionExpired() {
    if (_sessionStartTime == null) return true;
    
    // Sessione scade dopo 8 ore
    return AppDateUtils.hoursSince(_sessionStartTime!) > 8;
  }
}