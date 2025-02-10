import 'package:flutter/material.dart';
import 'package:shared_preferences.dart';

class SettingsService {
  static const String _themeKey = 'theme_mode';
  final SharedPreferences _prefs;

  SettingsService(this._prefs);

  Future<ThemeMode> getThemeMode() async {
    final String? themeName = _prefs.getString(_themeKey);
    return _themeFromString(themeName);
  }

  Future<void> saveThemeMode(ThemeMode theme) async {
    await _prefs.setString(_themeKey, theme.toString());
  }

  ThemeMode _themeFromString(String? themeName) {
    switch (themeName) {
      case 'ThemeMode.light':
        return ThemeMode.light;
      case 'ThemeMode.dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }
}
