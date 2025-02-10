import 'package:flutter/material.dart';
import '../services/settings_service.dart';

class ThemeProvider with ChangeNotifier {
  final SettingsService _settingsService;
  ThemeMode _themeMode = ThemeMode.system;

  ThemeProvider(this._settingsService) {
    _loadThemeMode();
  }

  ThemeMode get currentTheme => _themeMode;

  Future<void> _loadThemeMode() async {
    _themeMode = await _settingsService.getThemeMode();
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;

    _themeMode = mode;
    await _settingsService.saveThemeMode(mode);
    notifyListeners();
  }
}
