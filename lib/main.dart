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
import 'models/user_profile.dart';
import 'utils/platform_utils.dart';

// Create theme instances
final ThemeData lightTheme = ThemeData(
  brightness: Brightness.light,
  primarySwatch: Colors.blue,
  visualDensity: VisualDensity.adaptivePlatformDensity,
);

final ThemeData darkTheme = ThemeData(
  brightness: Brightness.dark,
  primarySwatch: Colors.blue,
  visualDensity: VisualDensity.adaptivePlatformDensity,
);

class SettingsService {
  final SharedPreferences _prefs;

  SettingsService(this._prefs);

  static Future<SettingsService> init(SharedPreferences prefs) async {
    return SettingsService(prefs);
  }

  ThemeMode get themeMode {
    final String? themeModeString = _prefs.getString('themeMode');
    switch (themeModeString) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    String themeModeString;
    switch (mode) {
      case ThemeMode.light:
        themeModeString = 'light';
        break;
      case ThemeMode.dark:
        themeModeString = 'dark';
        break;
      case ThemeMode.system:
        themeModeString = 'system';
        break;
    }
    await _prefs.setString('themeMode', themeModeString);
  }
}

class MyApp extends StatelessWidget {
  final SettingsService settingsService;

  const MyApp({
    Key? key,
    required this.settingsService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: settingsService.themeMode,
      onGenerateRoute: RouteGenerator.generateRoute,
      initialRoute: RouteGenerator.login,
      debugShowCheckedModeBanner: false,
    );
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize SharedPreferences and SettingsService
  final prefs = await SharedPreferences.getInstance();
  final settingsService = await SettingsService.init(prefs);

  // Initialize ThemeProvider with SettingsService
  final themeProvider = ThemeProvider(settingsService);

  // Initialize timezone data
  tz.initializeTimeZones();

  // Setup service locator
  setupServiceLocator();

  // Initialize notification service
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Set window size for desktop platforms
  if (!kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux)) {
    setWindowMinSize(const Size(800, 600));
    setWindowMaxSize(Size.infinite);
  }

  // Initialize FirestoreService
  final firestoreService = FirestoreService();

  // Initialize AppContextService
  final appContextService = AppContextService();

  // Initialize AuthService and get current user
  final authService = AuthService(firestoreService);
  final UserProfile? currentUser = await authService.getCurrentUser();

  // Initialize required services
  final analyticsService = AnalyticsService();
  await analyticsService.initialize();

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
        Provider<AnalyticsService>.value(value: analyticsService),
      ],
      child: Builder(
        builder: (context) {
          // Update app context with the build context
          appContextService.updateContext(context);

          // Update current user
          if (currentUser != null) {
            appContextService.updateCurrentUser(currentUser);
          }

          return MyApp(settingsService: settingsService);
        },
      ),
    ),
  );
}

// Extension method for RouteGenerator
extension RouteGeneratorExtension on RouteGenerator {
  static const String login = '/login';
  static const String home = '/home';
  static const String settings = '/settings';
}
