import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  static const String _themeKey = 'theme_mode';
  final SharedPreferences _prefs;

  ThemeMode _themeMode = ThemeMode.system;

  ThemeProvider(this._prefs) {
    _loadTheme();
  }

  ThemeMode get themeMode => _themeMode;

  void _loadTheme() {
    final savedTheme = _prefs.getString(_themeKey);
    if (savedTheme != null) {
      _themeMode = _themeModeFromString(savedTheme);
      notifyListeners();
    }
  }

  Future<void> _saveTheme(ThemeMode mode) async {
    await _prefs.setString(_themeKey, mode.toString());
  }

  ThemeMode _themeModeFromString(String theme) {
    switch (theme) {
      case 'ThemeMode.light':
        return ThemeMode.light;
      case 'ThemeMode.dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setLightMode() async {
    _themeMode = ThemeMode.light;
    await _saveTheme(_themeMode);
    notifyListeners();
  }

  Future<void> setDarkMode() async {
    _themeMode = ThemeMode.dark;
    await _saveTheme(_themeMode);
    notifyListeners();
  }

  Future<void> setSystemMode() async {
    _themeMode = ThemeMode.system;
    await _saveTheme(_themeMode);
    notifyListeners();
  }

  bool isDarkMode(BuildContext context) {
    if (_themeMode == ThemeMode.system) {
      return MediaQuery.of(context).platformBrightness == Brightness.dark;
    }
    return _themeMode == ThemeMode.dark;
  }
}
