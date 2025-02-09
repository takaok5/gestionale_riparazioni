import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../services/auth_service.dart';
import '../services/settings_service.dart';

class AppState extends ChangeNotifier {
  final AuthService _authService;
  final SettingsService _settingsService;

  UserProfile? _currentUser;
  ThemeMode _themeMode = ThemeMode.system;
  bool _isLoading = false;

  AppState({
    required AuthService authService,
    required SettingsService settingsService,
  })  : _authService = authService,
        _settingsService = settingsService {
    _init();
  }

  UserProfile? get currentUser => _currentUser;
  ThemeMode get themeMode => _themeMode;
  bool get isLoading => _isLoading;

  Future<void> _init() async {
    _setLoading(true);
    try {
      _themeMode = await _settingsService.getThemeMode();
      _currentUser = await _authService.getCurrentUser();
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
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshUser() async {
    _setLoading(true);
    try {
      _currentUser = await _authService.getCurrentUser();
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
