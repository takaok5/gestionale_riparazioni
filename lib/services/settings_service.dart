import 'package:shared_preferences/shared_preferences.dart';

class SettingsService {
  static const String darkModeKey = 'darkMode';
  final SharedPreferences _prefs;

  SettingsService(this._prefs);

  bool get isDarkMode => _prefs.getBool(darkModeKey) ?? false;

  Future<void> setDarkMode(bool value) async {
    await _prefs.setBool(darkModeKey, value);
  }
}
