import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_context_service.dart';

class AppContextInfo extends StatelessWidget {
  final AppContextService appContextService;
  const AppContextInfo({Key? key, required this.appContextService})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('User: ${appContextService.currentUser}'),
        Text('Date: ${appContextService.formattedDate}'),
      ],
    );
  }
}
