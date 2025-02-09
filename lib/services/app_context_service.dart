import 'package:flutter/foundation.dart';

class AppContextService extends ChangeNotifier {
  DateTime? _date;
  String? _user;

  void updateContext({DateTime? date, String? user}) {
    _date = date;
    _user = user;
    notifyListeners();
  }

  DateTime? get date => _date;
  String? get user => _user;
}