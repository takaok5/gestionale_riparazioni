import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../screens/home_screen.dart';
import '../screens/login_screen.dart';
import '../services/auth_service.dart';
import '../services/contabilita_service.dart';

class AuthWrapper extends StatelessWidget {
  final Widget child;
  final AuthService authService;
  final ContabilitaService contabilitaService;

  const AuthWrapper({
    Key? key,
    required this.child,
    required this.authService,
    required this.contabilitaService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: authService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CircularProgressIndicator();
        }

        if (!snapshot.hasData) {
          return const LoginScreen();
        }

        return child;
      },
    );
  }
}
