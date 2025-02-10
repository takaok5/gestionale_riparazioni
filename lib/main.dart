import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:window_size/window_size.dart';
import 'package:shared_preferences/shared_preferences.dart';
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

// Add MyApp class definition
class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: Provider.of<ThemeProvider>(context).currentTheme,
      onGenerateRoute: RouteGenerator.generateRoute,
      initialRoute: RouteGenerator.login,
    );
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  final themeProvider = ThemeProvider(prefs);
  // Fix: Remove the prefs parameter from SettingsProvider constructor
  final settingsProvider = SettingsProvider();

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

  final appContextService = AppContextService();
  appContextService.updateContext(
    date: DateTime.now().toUtc(),
    user: 'takaok5',
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => appContextService),
        ChangeNotifierProvider.value(value: themeProvider),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            firestoreService: locator<FirestoreService>(),
          ),
        ),
        ChangeNotifierProvider.value(value: settingsProvider),
      ],
      child: const MyApp(),
    ),
  );
}
