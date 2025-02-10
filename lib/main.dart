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

// Create theme instances
final ThemeData lightTheme = ThemeData(
  brightness: Brightness.light,
  // Add your light theme configurations here
);

final ThemeData darkTheme = ThemeData(
  brightness: Brightness.dark,
  // Add your dark theme configurations here
);

class SettingsService {
  final SharedPreferences _prefs;

  SettingsService(this._prefs);

  static Future<SettingsService> init(SharedPreferences prefs) async {
    return SettingsService(prefs);
  }

  ThemeMode get themeMode =>
      ThemeMode.system; // You can implement the actual logic here
}

final settingsProvider = ChangeNotifierProvider<SettingsProvider>(
  create: (_) => SettingsProvider(),
);

// Add MyApp class definition
class MyApp extends StatelessWidget {
  final SettingsService settingsService;

  const MyApp({Key? key, required this.settingsService}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: settingsService.themeMode,
      title: 'Gestionale Riparazioni',
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
  final settingsService = await SettingsService.init(prefs);

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
  // Get the current user from your auth provider or service
  final currentUser =
      await getCurrentUser(); // Implement this function based on your auth system

  appContextService.updateContext(
    currentDate: DateTime.now(),
    currentUser: currentUser,
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => themeProvider),
        ChangeNotifierProvider(create: (_) => appContextService),
        ChangeNotifierProvider(
          create: (_) => AuthProvider(
            firestoreService: locator<FirestoreService>(),
          ),
        ),
        ChangeNotifierProvider<SettingsProvider>(
          create: (_) => SettingsProvider(),
        ),
      ],
      child: MyApp(settingsService: settingsService),
    ),
  );
}

// Add this function to get the current user
Future<User?> getCurrentUser() async {
  // Implement your logic to get the current user
  // This might involve Firebase Auth or your custom auth system
  return null; // Replace with actual implementation
}
