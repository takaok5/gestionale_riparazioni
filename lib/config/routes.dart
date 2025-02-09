import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import '../screens/screens.dart';
import '../services/services.dart';
import '../providers/auth_provider.dart';

class RouteGenerator {
  static final locator = GetIt.instance;  // Aggiunto per risolvere l'errore del locator

  static const String home = '/';
  static const String login = '/login';
  static const String dashboard = '/dashboard';
  static const String kanban = '/kanban';
  static const String settings = '/settings';
  static const String chat = '/chat';
  static const String garanziaDetails = '/garanzia_details';
  static const String garanzie = '/garanzie';
  static const String gestioneFornitori = '/gestione_fornitori';
  static const String gestioneMagazzino = '/gestione_magazzino';
  static const String reportContabilita = '/report_contabilita';
  static const String riparazioni = '/riparazioni';
  static const String storicoCliente = '/storico_cliente';
  static const String ordini = '/ordini';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    final args = settings.arguments;

    if (settings.name != login && !AuthProvider().isAuthenticated) {
      return MaterialPageRoute(
        builder: (_) => const LoginScreen(),
        settings: const RouteSettings(name: login),
      );
    }

    try {
      switch (settings.name) {
        case '/':
          return MaterialPageRoute(
            builder: (_) => const LoginScreen(),
          );
        case '/home':
          return MaterialPageRoute(
            builder: (_) => HomeScreen(
              authService: locator<AuthService>(),
              contabilitaService: locator<ContabilitaService>(), // Aggiunto parametro mancante
            ),
          );
        case '/riparazioni':
          return MaterialPageRoute(
            builder: (_) => RiparazioniScreen(
              firestoreService: locator<FirestoreService>(),
            ),
          );
        // ... resto dei case esistenti ...

        case garanziaDetails:
          if (args is! String) throw ArgumentError('Richiesto ID garanzia');
          return _buildRoute(
            GaranziaDetailsScreen(
              garanziaId: args,
              garanziaService: locator<GaranziaService>(), // Aggiunto servizio mancante
            ), 
            settings
          );
        case storicoCliente:
          if (args is! String) throw ArgumentError('Richiesto ID cliente');
          return _buildRoute(
            StoricoClienteScreen(
              clienteId: args,
              firestoreService: locator<FirestoreService>(), // Aggiunto servizio mancante
            ), 
            settings
          );
        default:
          return _buildRoute(
            ErrorScreen(
              message: 'Route ${settings.name} non trovata',
              routeName: settings.name ?? 'sconosciuta',
            ),
            settings,
          );
      }
    } catch (e) {
      return MaterialPageRoute(
        builder: (_) => ErrorScreen(
          message: 'Errore durante la navigazione: ${e.toString()}',
          routeName: settings.name ?? 'sconosciuta',
        ),
      );
    }
  }

  static PageRoute<T> _buildRoute<T>(Widget page, RouteSettings settings) {
    return MaterialPageRoute<T>(
      builder: (_) => page,
      settings: settings,
      maintainState: true,
      fullscreenDialog: settings.name == settings || settings.name == chat,
    );
  }

  static void navigateTo(BuildContext context, String routeName, {Object? arguments}) {
    Navigator.of(context).pushNamed(routeName, arguments: arguments);
  }

  static void replaceTo(BuildContext context, String routeName, {Object? arguments}) {
    Navigator.of(context).pushReplacementNamed(routeName, arguments: arguments);
  }

  static void popUntil(BuildContext context, String routeName) {
    Navigator.of(context).popUntil(ModalRoute.withName(routeName));
  }
}