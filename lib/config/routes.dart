import 'package:flutter/material.dart';
import '../screens/chat_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/garanzia_details_screen.dart';
import '../screens/garanzie_screen.dart';
import '../screens/gestione_fornitori_screen.dart';
import '../screens/gestione_magazzino_screen.dart';
import '../screens/home_screen.dart';
import '../screens/impostazioni_screen.dart';
import '../screens/kanban_riparazioni_screen.dart';
import '../screens/login_screen.dart';
import '../screens/report_contabilita_screen.dart';
import '../screens/riparazioni_screen.dart';
import '../screens/storico_cliente_screen.dart';
import '../screens/error_screen.dart';
import '../screens/ordini_screen.dart';
import '../providers/auth_provider.dart';
import '../models/garanzia.dart';  // Aggiunto per il tipo Garanzia
import '../services/firestore_service.dart';
import '../services/garanzia_service.dart';
import '../services/auth_service.dart';
import '../services/ordini_service.dart';
import '../services/inventory_service.dart';
import 'package:get_it/get_it.dart';

class RouteGenerator {
  static final locator = GetIt.instance;
  
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
            ),
          );
        case '/riparazioni':
          return MaterialPageRoute(
            builder: (_) => RiparazioniScreen(
              firestoreService: locator<FirestoreService>(),
            ),
          );
        case '/kanban':
          return MaterialPageRoute(
            builder: (_) => KanbanRiparazioniScreen(
              firestoreService: locator<FirestoreService>(),
            ),
          );
        case '/magazzino':
          return MaterialPageRoute(
            builder: (_) => GestioneMagazzinoScreen(
              inventoryService: locator<InventoryService>(),
            ),
          );
        case '/ordini':
          return MaterialPageRoute(
            builder: (_) => OrdiniScreen(
              ordiniService: locator<OrdiniService>(),
            ),
          );
        case '/garanzie':
          return MaterialPageRoute(
            builder: (_) => GaranzieScreen(
              garanziaService: locator<GaranziaService>(),
            ),
          );
        case '/garanzia_details':
          if (args is! Garanzia) throw ArgumentError('Richiesta garanzia');
          return MaterialPageRoute(
            builder: (_) => GaranziaDetailsScreen(
              garanzia: args,
            ),
          );
        case '/storico_cliente':
          if (args is! String) throw ArgumentError('Richiesto ID cliente');
          return MaterialPageRoute(
            builder: (_) => StoricoClienteScreen(
              clienteId: args,
              firestoreService: locator<FirestoreService>(),
            ),
          );
        case '/impostazioni':
          return MaterialPageRoute(
            builder: (_) => const ImpostazioniScreen(),
          );
        default:
          return MaterialPageRoute(
            builder: (_) => ErrorScreen(
              message: 'Route ${settings.name} non trovata',
            ),
          );
      }
    } catch (e) {
      return MaterialPageRoute(
        builder: (_) => ErrorScreen(
          message: 'Errore durante la navigazione: ${e.toString()}',
        ),
      );
    }
  }

  static Route<T> _buildRoute<T>(Widget widget, RouteSettings settings) {
    return MaterialPageRoute<T>(
      builder: (_) => widget,
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