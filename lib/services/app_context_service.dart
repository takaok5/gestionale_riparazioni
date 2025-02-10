import 'package:flutter/material.dart';
import '../models/user_profile.dart';

class AppContextService extends ChangeNotifier {
  BuildContext? _context;
  UserProfile? _currentUser;

  BuildContext? get context => _context;
  UserProfile? get currentUser => _currentUser;

  void updateContext(BuildContext context) {
    _context = context;
    notifyListeners();
  }

  void updateCurrentUser(UserProfile? user) {
    _currentUser = user;
    notifyListeners();
  }

  void clear() {
    _context = null;
    _currentUser = null;
    notifyListeners();
  }
}