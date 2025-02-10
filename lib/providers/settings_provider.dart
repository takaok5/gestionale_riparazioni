import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class SettingsProvider extends ChangeNotifier {
  SharedPreferences? _prefs;
  ThemeMode _themeMode = ThemeMode.system;
  Locale _locale = const Locale('it', 'IT');
  DateTime? _lastSettingsUpdate;
  String _dateFormat = 'dd/MM/yyyy';
  String _timeFormat = 'HH:mm';
  bool _use24HourFormat = true;
  String _firstDayOfWeek = 'monday';
  int _cacheDurationHours = 24;

  // Getters esistenti
  ThemeMode get themeMode => _themeMode;
  Locale get locale => _locale;

  // Nuovi getters per le impostazioni delle date
  String get dateFormat => _dateFormat;
  String get timeFormat => _timeFormat;
  bool get use24HourFormat => _use24HourFormat;
  String get firstDayOfWeek => _firstDayOfWeek;
  int get cacheDurationHours => _cacheDurationHours;
  
  // Getters formattati per le date
  String? get lastSettingsUpdateFormatted => _lastSettingsUpdate != null
      ? AppDateUtils.formatDateTime(_lastSettingsUpdate!)
      : null;

  String get nextCacheReset => _lastSettingsUpdate != null
      ? AppDateUtils.formatDateTime(
          _lastSettingsUpdate!.add(Duration(hours: _cacheDurationHours)))
      : 'Non impostato';

  bool get needsCacheReset => _lastSettingsUpdate != null &&
      AppDateUtils.hoursSince(_lastSettingsUpdate!) >= _cacheDurationHours;

  SettingsProvider() {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Carica impostazioni esistenti
    _themeMode = ThemeMode.values[_prefs?.getInt('themeMode') ?? 0];
    _locale = Locale(
      _prefs?.getString('languageCode') ?? 'it',
      _prefs?.getString('countryCode') ?? 'IT',
    );

    // Carica impostazioni relative alle date
    _dateFormat = _prefs?.getString('dateFormat') ?? 'dd/MM/yyyy';
    _timeFormat = _prefs?.getString('timeFormat') ?? 'HH:mm';
    _use24HourFormat = _prefs?.getBool('use24HourFormat') ?? true;
    _firstDayOfWeek = _prefs?.getString('firstDayOfWeek') ?? 'monday';
    _cacheDurationHours = _prefs?.getInt('cacheDurationHours') ?? 24;

    // Carica l'ultimo aggiornamento
    final lastUpdateStr = _prefs?.getString('lastSettingsUpdate');
    if (lastUpdateStr != null) {
      _lastSettingsUpdate = AppDateUtils.parseDateTime(lastUpdateStr);
    }

    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    await _prefs?.setInt('themeMode', mode.index);
    _updateLastSettingsTime();
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    await _prefs?.setString('languageCode', locale.languageCode);
    await _prefs?.setString('countryCode', locale.countryCode ?? '');
    _updateLastSettingsTime();
    notifyListeners();
  }

  // Nuovi metodi per la gestione delle impostazioni delle date
  Future<void> setDateFormat(String format) async {
    _dateFormat = format;
    await _prefs?.setString('dateFormat', format);
    _updateLastSettingsTime();
    notifyListeners();
  }

  Future<void> setTimeFormat(String format) async {
    _timeFormat = format;
    await _prefs?.setString('timeFormat', format);
    _updateLastSettingsTime();
    notifyListeners();
  }

  Future<void> setUse24HourFormat(bool use24Hour) async {
    _use24HourFormat = use24Hour;
    await _prefs?.setBool('use24HourFormat', use24Hour);
    _updateLastSettingsTime();
    notifyListeners();
  }

  Future<void> setFirstDayOfWeek(String firstDay) async {
    _firstDayOfWeek = firstDay;
    await _prefs?.setString('firstDayOfWeek', firstDay);
    _updateLastSettingsTime();
    notifyListeners();
  }

  Future<void> setCacheDuration(int hours) async {
    _cacheDurationHours = hours;
    await _prefs?.setInt('cacheDurationHours', hours);
    _updateLastSettingsTime();
    notifyListeners();
  }

  // Metodi di utilità per la gestione delle date
  void _updateLastSettingsTime() {
    _lastSettingsUpdate = AppDateUtils.getCurrentDateTime();
    _prefs?.setString('lastSettingsUpdate', 
        AppDateUtils.formatDateTime(_lastSettingsUpdate!));
  }

  String formatDate(DateTime date) {
    return AppDateUtils.formatDate(date, format: _dateFormat);
  }

  String formatTime(DateTime time) {
    return AppDateUtils.formatTime(time, 
        format: _timeFormat, 
        use24HourFormat: _use24HourFormat);
  }

  String formatDateTime(DateTime dateTime) {
    return AppDateUtils.formatDateTime(dateTime, 
        dateFormat: _dateFormat,
        timeFormat: _timeFormat,
        use24HourFormat: _use24HourFormat);
  }

  // Metodo per ottenere le impostazioni correnti come mappa
  Map<String, String> getCurrentDateSettings() {
    return {
      'Formato data': _dateFormat,
      'Formato ora': _timeFormat,
      'Formato 24 ore': _use24HourFormat.toString(),
      'Primo giorno settimana': _firstDayOfWeek,
      'Durata cache': '$_cacheDurationHours ore',
      'Ultimo aggiornamento': lastSettingsUpdateFormatted ?? 'Mai',
      'Prossimo reset cache': nextCacheReset,
    };
  }

  // Metodo per verificare se le impostazioni sono aggiornate
  bool areSettingsStale() {
    if (_lastSettingsUpdate == null) return true;
    return AppDateUtils.daysSince(_lastSettingsUpdate!) > 7;
  }

  // Metodo per resettare le impostazioni ai valori predefiniti
  Future<void> resetToDefaults() async {
    await setDateFormat('dd/MM/yyyy');
    await setTimeFormat('HH:mm');
    await setUse24HourFormat(true);
    await setFirstDayOfWeek('monday');
    await setCacheDuration(24);
    _updateLastSettingsTime();
  }
}