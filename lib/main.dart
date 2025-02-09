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
import 'services/app_context_service.dart';
import 'utils/platform_utils.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final settingsService = SettingsService(prefs);

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  tz.initializeTimeZones();

  setupServiceLocator();

  final notificationService = NotificationService();
  await notificationService.initialize();

  if (!kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux)) {
    setWindowMinSize(const Size(800, 600));
    setWindowMaxSize(Size.infinite);
  }

  final settingsProvider = SettingsProvider();
  final appContextService = AppContextService()
    ..updateContext(
      date: DateTime.now().toUtc(),
      user: 'takaok5',
    );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => appContextService),
        ChangeNotifierProvider(
          create: (_) => ThemeProvider(isDarkMode: false),
        ),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            firestoreService: locator<FirestoreService>(),
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
