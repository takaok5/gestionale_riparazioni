import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:window_size/window_size.dart';
import 'dart:io';
import 'package:timezone/data/latest_all.dart' as tz;

import 'firebase_options.dart';
import 'config/routes.dart';
import 'theme/app_theme.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/settings_provider.dart';
import 'services/notification_service.dart';
import 'services/analytics_service.dart';
import 'services/locator.dart';
import 'services/firestore_service.dart';
import 'utils/platform_utils.dart';

Future<void> main() async {
  // Assicurati che Flutter sia inizializzato
  WidgetsFlutterBinding.ensureInitialized();

  // Inizializza Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Inizializza le timezone
  tz.initializeTimeZones();

  // Setup del service locator
  setupServiceLocator();

  // Inizializza le notifiche
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Imposta la dimensione della finestra se su desktop
  if (!kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux)) {
    setWindowMinSize(const Size(800, 600));
    setWindowMaxSize(Size.infinite);
  }

  // Inizializza le impostazioni
  final settingsProvider = SettingsProvider();
  await settingsProvider.initialize();
  final appContextService = AppContextService()
    ..updateContext(
      date: DateTime.utc(2025, 2, 9, 11, 9, 24),
      user: 'takaok5',
    );
  // Avvia l'app con i provider necessari
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => appContextService),
        ChangeNotifierProvider(
          create: (_) => ThemeProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            firestore: getIt<FirestoreService>(),
          ),
        ),
        ChangeNotifierProvider.value(
          value: settingsProvider,
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final settingsProvider = context.watch<SettingsProvider>();

    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: themeProvider.themeMode,
      locale: settingsProvider.locale,
      navigatorKey: NotificationService.navigatorKey,
      onGenerateRoute: RouteGenerator.generateRoute,
      initialRoute: '/',
      debugShowCheckedModeBanner: false,
    );
  }
}
