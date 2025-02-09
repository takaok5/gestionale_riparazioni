import 'package:flutter/material.dart';
// Rimuovere gli import non utilizzati
import 'config/routes.dart';
import 'config/theme.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      onGenerateRoute: RouteGenerator.generateRoute,
      initialRoute: '/',
    );
  }
}

Route<dynamic>? onGenerateRoute(RouteSettings settings) {
  // Aggiungere return null per gestire il caso nullable
  return null;
}