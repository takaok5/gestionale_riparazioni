import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_context_service.dart';

class AppContextInfo extends StatelessWidget {
  const AppContextInfo({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AppContextService>(
      builder: (context, appContext, child) {
        return Container(
          padding: const EdgeInsets.all(8),
          color: Colors.grey[200],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Utente: ${appContext.currentUser}'),
              Text('Data: ${appContext.formattedDate}'),
            ],
          ),
        );
      },
    );
  }
}
