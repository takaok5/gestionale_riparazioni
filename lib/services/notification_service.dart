import 'package:timezone/data/latest_all.dart' as tz;
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import '../utils/date_utils.dart' show AppDateUtils;

class NotificationService {
  static final navigatorKey = GlobalKey<NavigatorState>();
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Inizializza timezone
    tz.initializeTimeZones();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings();

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      // Implementa la logica di navigazione qui
    }
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'gestionale_riparazioni',
      'Gestionale Riparazioni',
      channelDescription: 'Notifiche del gestionale riparazioni',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final now = AppDateUtils.getCurrentDateTime();
    final formattedDate = AppDateUtils.formatDateTime(now);

    // Aggiunge timestamp alla notifica
    final enhancedBody = '$body\n\nInviato il: $formattedDate';

    await _notifications.show(id, title, enhancedBody, details,
        payload: payload);
  }

  Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'gestionale_riparazioni',
      'Gestionale Riparazioni',
      channelDescription: 'Notifiche del gestionale riparazioni',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Converti alla timezone corretta usando AppDateUtils
    final scheduledUtc = AppDateUtils.toUtc(scheduledDate);
    final formattedDate = AppDateUtils.formatDateTime(scheduledDate);

    // Aggiungi informazioni temporali al body
    final enhancedBody = '''
$body

Programmato per: $formattedDate
Giorni rimanenti: ${AppDateUtils.daysBetween(AppDateUtils.getCurrentDateTime(), scheduledDate)}
''';

    await _notifications.zonedSchedule(
      id,
      title,
      enhancedBody,
      tz.TZDateTime.from(scheduledUtc, tz.UTC),
      details,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      payload: payload,
    );
  }

  Future<void> scheduleRecurringNotification({
    required int id,
    required String title,
    required String body,
    required DateTime firstDate,
    required Duration interval,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'gestionale_riparazioni_recurring',
      'Gestionale Riparazioni Ricorrenti',
      channelDescription: 'Notifiche ricorrenti del gestionale riparazioni',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails();

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Usa AppDateUtils per gestire la data di inizio
    final startDate = AppDateUtils.toUtc(firstDate);
    final formattedDate = AppDateUtils.formatDateTime(firstDate);

    final enhancedBody = '''
$body

Prima occorrenza: $formattedDate
Intervallo: ${_formatDuration(interval)}
''';

    await _notifications.zonedSchedule(
      id,
      title,
      enhancedBody,
      tz.TZDateTime.from(startDate, tz.UTC),
      details,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.dayOfWeekAndTime,
      payload: payload,
    );
  }

  String _formatDuration(Duration duration) {
    if (duration.inDays > 0) {
      return '${duration.inDays} giorni';
    } else if (duration.inHours > 0) {
      return '${duration.inHours} ore';
    } else {
      return '${duration.inMinutes} minuti';
    }
  }

  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  // Nuovo metodo per verificare notifiche programmate
  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    final pendingNotifications =
        await _notifications.pendingNotificationRequests();
    // Aggiungi informazioni temporali alle notifiche pendenti
    return pendingNotifications.map((notification) {
      final now = AppDateUtils.getCurrentDateTime();
      // La data programmata è nel payload o può essere ricavata dai metadati della notifica
      // Implementa la logica specifica per il tuo caso d'uso
      return notification;
    }).toList();
  }
}
