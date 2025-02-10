import 'package:flutter/material.dart';
import '../screens/home_screen.dart';
import '../screens/impostazioni_screen.dart';
import '../screens/kanban_riparazioni_screen.dart';
import '../screens/login_screen.dart';
import '../screens/riparazioni_screen.dart';
import '../screens/garanzie_screen.dart';
import '../screens/garanzia_details_screen.dart';
import '../screens/gestione_magazzino_screen.dart';
import '../screens/storico_cliente_screen.dart';
import '../screens/ordini_screen.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../services/contabilita_service.dart';
import '../services/firestore_service.dart';
import '../services/garanzia_service.dart';
import '../services/ordini_service.dart';
import '../services/inventory_service.dart';
import 'package:get_it/get_it.dart';
import '../models/cliente.dart';
import '../models/garanzia_info.dart';

class RouteGenerator {
  static final GetIt locator = GetIt.instance;
  static const String home = '/';
  static const String login = '/login';
  static const String kanban = '/kanban';
  static const String settings = '/settings';
  static const String garanzie = '/garanzie';
  static const String gestioneMagazzino = '/gestione_magazzino';
  static const String riparazioni = '/riparazioni';
  static const String storicoCliente = '/storico_cliente';
  static const String ordini = '/ordini';
  static const String impostazioni = '/impostazioni';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    final args = settings.arguments;
    final authProvider = locator<AuthProvider>();

    if (settings.name != login && !authProvider.isAuthenticated) {
      // Remove the firestoreService parameter since it's not defined in LoginScreen
      return MaterialPageRoute(
        builder: (_) => const LoginScreen(),
        settings: const RouteSettings(name: login),
      );
    }

    try {
      switch (settings.name) {
        case '/kanban':
          return MaterialPageRoute(
            builder: (_) => KanbanRiparazioniScreen(
              firestoreService: locator.get<FirestoreService>(),
            ),
          );

        case '/riparazioni':
          return MaterialPageRoute(
            builder: (_) => const RiparazioniScreen(),
          );

        case '/magazzino':
          return MaterialPageRoute(
            builder: (_) => const GestioneMagazzinoScreen(),
          );

        case '/ordini':
          return MaterialPageRoute(
            builder: (_) => const OrdiniScreen(),
          );

        case '/garanzie':
          return MaterialPageRoute(
            builder: (_) => const GaranzieScreen(),
          );

        case '/garanzia_details':
          if (args == null) throw ArgumentError('Richiesto ID garanzia');
          return MaterialPageRoute(
            builder: (_) => FutureBuilder<GaranziaInfo?>(
              future: locator.get<GaranziaService>().getGaranzia(args as String),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator();
                }
                return GaranziaDetailsScreen(
                  garanziaId: args as String,
                  garanzia: snapshot.data,
                  garanziaService: locator.get<GaranziaService>(),
                );
              },
            ),
          );

        case '/storico_cliente':
          if (args == null) throw ArgumentError('Richiesto ID cliente');
          return MaterialPageRoute(
            builder: (_) => FutureBuilder<Cliente>(
              future: locator.get<FirestoreService>().getCliente(args as String),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const CircularProgressIndicator();
                }
                return StoricoClienteScreen(
                  clienteId: args as String,
                  cliente: snapshot.data!,
                  firestoreService: locator.get<FirestoreService>(),
                );
              },
            ),
          );

        case '/impostazioni':
          return MaterialPageRoute(
            builder: (_) => const ImpostazioniScreen(),
          );

        default:
          return MaterialPageRoute(
            builder: (_) => Scaffold(
              body: Center(
                child: Text('Route ${settings.name} non trovata'),
              ),
            ),
          );
      }
    } catch (e) {
      return MaterialPageRoute(
        builder: (_) => Scaffold(
          body: Center(
            child: Text('Errore durante la navigazione: ${e.toString()}'),
          ),
        ),
      );
    }
  }

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