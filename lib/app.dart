import 'package:flutter/material.dart';
import 'config/routes.dart';
import 'config/theme.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      onGenerateRoute: RouteGenerator.generateRoute,
      initialRoute: '/',
    );
  }
}
