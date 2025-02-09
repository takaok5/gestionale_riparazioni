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
import '../screens/ordini_screen.dart'; // Aggiungere dopo la riga 15
import '../providers/auth_provider.dart';
import '../screens/screens.dart';
import '../services/services.dart';

class RouteGenerator {
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
  static const String ordini = '/ordini'; // Aggiungere dopo la riga 31
  static Route<dynamic> generateRoute(RouteSettings settings) {
    // Gestione degli argomenti tipizzati
    final args = settings.arguments;

    // Controllo dell'autenticazione per le rotte protette
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
        case '/impostazioni':
          return MaterialPageRoute(
            builder: (_) => const ImpostazioniScreen(),
          );
        case home:
          return _buildRoute(const HomeScreen(), settings);
        case login:
          return _buildRoute(const LoginScreen(), settings);
        case dashboard:
          return _buildRoute(const DashboardScreen(), settings);
        case kanban:
          return _buildRoute(const KanbanRiparazioniScreen(), settings);
        case settings:
          return _buildRoute(const ImpostazioniScreen(), settings);
        case chat:
          return _buildRoute(const ChatScreen(), settings);
        case garanziaDetails:
          if (args is! String) throw ArgumentError('Richiesto ID garanzia');
          return _buildRoute(GaranziaDetailsScreen(garanziaId: args), settings);
        case garanzie:
          return _buildRoute(const GaranzieScreen(), settings);
        case gestioneFornitori:
          return _buildRoute(const GestioneFornitoriScreen(), settings);
        case gestioneMagazzino:
          return _buildRoute(const GestioneMagazzinoScreen(), settings);
        case reportContabilita:
          return _buildRoute(const ReportContabilitaScreen(), settings);
        case riparazioni:
          return _buildRoute(const RiparazioniScreen(), settings);
        case ordini:
          return _buildRoute(const OrdiniScreen(), settings);
        case storicoCliente:
          if (args is! String) throw ArgumentError('Richiesto ID cliente');
          return _buildRoute(StoricoClienteScreen(clienteId: args), settings);
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

  // Helpers per la navigazione
  static void navigateTo(BuildContext context, String routeName,
      {Object? arguments}) {
    Navigator.of(context).pushNamed(routeName, arguments: arguments);
  }

  static void replaceTo(BuildContext context, String routeName,
      {Object? arguments}) {
    Navigator.of(context).pushReplacementNamed(routeName, arguments: arguments);
  }

  static void popUntil(BuildContext context, String routeName) {
    Navigator.of(context).popUntil(ModalRoute.withName(routeName));
  }
}
