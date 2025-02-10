import 'package:flutter/material.dart';
import '../services/settings_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class ThemeProvider with ChangeNotifier {
  final SettingsService _settingsService;
  ThemeMode _themeMode = ThemeMode.system;
  DateTime? _lastThemeChange;
  DateTime? _lastAutoThemeCheck;
  bool _isAutoThemeEnabled = false;
  TimeOfDay _autoDarkThemeStart = const TimeOfDay(hour: 20, minute: 0);
  TimeOfDay _autoDarkThemeEnd = const TimeOfDay(hour: 6, minute: 0);

  ThemeProvider(this._settingsService) {
    _loadThemeMode();
  }

  // Getters esistenti migliorati
  ThemeMode get currentTheme => _themeMode;
  bool get isAutoThemeEnabled => _isAutoThemeEnabled;

  // Nuovi getters per le informazioni temporali
  String? get lastThemeChangeFormatted => _lastThemeChange != null
      ? AppDateUtils.formatDateTime(_lastThemeChange!)
      : null;

  String? get lastAutoThemeCheckFormatted => _lastAutoThemeCheck != null
      ? AppDateUtils.formatDateTime(_lastAutoThemeCheck!)
      : null;

  String get autoDarkThemeStartFormatted =>
      AppDateUtils.formatTimeOfDay(_autoDarkThemeStart);

  String get autoDarkThemeEndFormatted =>
      AppDateUtils.formatTimeOfDay(_autoDarkThemeEnd);

  Future<void> _loadThemeMode() async {
    _themeMode = await _settingsService.getThemeMode();
    _loadThemeSettings();

    if (_isAutoThemeEnabled) {
      _checkAutoTheme();
    }

    notifyListeners();
  }

  Future<void> _loadThemeSettings() async {
    // Carica le impostazioni salvate
    _isAutoThemeEnabled =
        await _settingsService.getBool('autoThemeEnabled') ?? false;

    final lastChangeStr = await _settingsService.getString('lastThemeChange');
    if (lastChangeStr != null) {
      _lastThemeChange = AppDateUtils.parseDateTime(lastChangeStr);
    }

    final startHour =
        await _settingsService.getInt('autoDarkThemeStartHour') ?? 20;
    final startMinute =
        await _settingsService.getInt('autoDarkThemeStartMinute') ?? 0;
    _autoDarkThemeStart = TimeOfDay(hour: startHour, minute: startMinute);

    final endHour = await _settingsService.getInt('autoDarkThemeEndHour') ?? 6;
    final endMinute =
        await _settingsService.getInt('autoDarkThemeEndMinute') ?? 0;
    _autoDarkThemeEnd = TimeOfDay(hour: endHour, minute: endMinute);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;

    _themeMode = mode;
    _lastThemeChange = AppDateUtils.getCurrentDateTime();

    await Future.wait([
      _settingsService.saveThemeMode(mode),
      _settingsService.setString(
          'lastThemeChange', AppDateUtils.formatDateTime(_lastThemeChange!)),
    ]);

    notifyListeners();
  }

  Future<void> setAutoThemeEnabled(bool enabled) async {
    _isAutoThemeEnabled = enabled;
    await _settingsService.setBool('autoThemeEnabled', enabled);

    if (enabled) {
      _checkAutoTheme();
    }

    notifyListeners();
  }

  Future<void> setAutoDarkThemeTime({
    TimeOfDay? start,
    TimeOfDay? end,
  }) async {
    if (start != null) {
      _autoDarkThemeStart = start;
      await Future.wait([
        _settingsService.setInt('autoDarkThemeStartHour', start.hour),
        _settingsService.setInt('autoDarkThemeStartMinute', start.minute),
      ]);
    }

    if (end != null) {
      _autoDarkThemeEnd = end;
      await Future.wait([
        _settingsService.setInt('autoDarkThemeEndHour', end.hour),
        _settingsService.setInt('autoDarkThemeEndMinute', end.minute),
      ]);
    }

    if (_isAutoThemeEnabled) {
      _checkAutoTheme();
    }

    notifyListeners();
  }

  void _checkAutoTheme() {
    final now = AppDateUtils.getCurrentDateTime();
    _lastAutoThemeCheck = now;

    // Converti l'ora corrente in minuti dalla mezzanotte
    final currentMinutes = now.hour * 60 + now.minute;
    final startMinutes =
        _autoDarkThemeStart.hour * 60 + _autoDarkThemeStart.minute;
    final endMinutes = _autoDarkThemeEnd.hour * 60 + _autoDarkThemeEnd.minute;

    // Determina se dovrebbe essere attivo il tema scuro
    bool shouldBeDark;
    if (startMinutes < endMinutes) {
      // Periodo nel stesso giorno
      shouldBeDark =
          currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Periodo attraverso la mezzanotte
      shouldBeDark =
          currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Imposta il tema appropriato
    final newMode = shouldBeDark ? ThemeMode.dark : ThemeMode.light;
    if (_themeMode != newMode) {
      setThemeMode(newMode);
    }
  }

  // Metodo per ottenere le statistiche del tema
  Map<String, String> getThemeStatistics() {
    return {
      'Tema corrente': _themeMode.toString().split('.').last,
      'Ultimo cambio tema': lastThemeChangeFormatted ?? 'Mai',
      'Ultimo controllo automatico': lastAutoThemeCheckFormatted ?? 'Mai',
      'Tema automatico': _isAutoThemeEnabled ? 'Attivo' : 'Disattivo',
      'Inizio tema scuro': autoDarkThemeStartFormatted,
      'Fine tema scuro': autoDarkThemeEndFormatted,
    };
  }

  // Verifica se il tema è stato cambiato di recente
  bool hasRecentThemeChange() {
    if (_lastThemeChange == null) return false;
    return AppDateUtils.minutesSince(_lastThemeChange!) < 5;
  }

  // Programma il prossimo cambio tema
  DateTime getNextThemeChange() {
    final now = AppDateUtils.getCurrentDateTime();
    final currentMinutes = now.hour * 60 + now.minute;

    if (_themeMode == ThemeMode.dark) {
      // Se siamo in modalità scura, il prossimo cambio sarà all'ora di fine
      final endMinutes = _autoDarkThemeEnd.hour * 60 + _autoDarkThemeEnd.minute;
      if (currentMinutes >= endMinutes) {
        // Se l'ora di fine è già passata, sarà domani
        return now
            .add(const Duration(days: 1))
            .subtract(Duration(hours: now.hour, minutes: now.minute))
            .add(Duration(
                hours: _autoDarkThemeEnd.hour,
                minutes: _autoDarkThemeEnd.minute));
      } else {
        // Altrimenti sarà oggi
        return now.subtract(Duration(hours: now.hour, minutes: now.minute)).add(
            Duration(
                hours: _autoDarkThemeEnd.hour,
                minutes: _autoDarkThemeEnd.minute));
      }
    } else {
      // Se siamo in modalità chiara, il prossimo cambio sarà all'ora di inizio
      final startMinutes =
          _autoDarkThemeStart.hour * 60 + _autoDarkThemeStart.minute;
      if (currentMinutes >= startMinutes) {
        // Se l'ora di inizio è già passata, sarà domani
        return now
            .add(const Duration(days: 1))
            .subtract(Duration(hours: now.hour, minutes: now.minute))
            .add(Duration(
                hours: _autoDarkThemeStart.hour,
                minutes: _autoDarkThemeStart.minute));
      } else {
        // Altrimenti sarà oggi
        return now.subtract(Duration(hours: now.hour, minutes: now.minute)).add(
            Duration(
                hours: _autoDarkThemeStart.hour,
                minutes: _autoDarkThemeStart.minute));
      }
    }
  }
}
