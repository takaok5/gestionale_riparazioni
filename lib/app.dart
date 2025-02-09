import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/app_context_service.dart';
import 'widgets/app_context_info.dart';

class App extends StatelessWidget {
  const App({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gestionale Riparazioni',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white,
      ),
      home: Scaffold(
        body: Column(
          children: [
            const AppContextInfo(),
            Expanded(
              child: Navigator(
                onGenerateRoute: (settings) {
                  // Configurazione delle route
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
