import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firestore_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirestoreService _firestoreService;

  AuthProvider({required FirestoreService firestoreService})
      : _firestoreService = firestoreService;

  // Getter per informazioni sull'utente con date formattate
  String? get lastSignInTime => _auth.currentUser?.metadata.lastSignInTime != null
      ? AppDateUtils.formatDateTime(_auth.currentUser!.metadata.lastSignInTime!)
      : null;

  String? get creationTime => _auth.currentUser?.metadata.creationTime != null
      ? AppDateUtils.formatDateTime(_auth.currentUser!.metadata.creationTime!)
      : null;

  String? get lastActivityTime {
    final lastActivity = _auth.currentUser?.metadata.lastSignInTime;
    return lastActivity != null ? AppDateUtils.timeAgo(lastActivity) : null;
  }

  bool get isAuthenticated => _auth.currentUser != null;

  // Verifica se l'account è stato creato recentemente (ultimi 7 giorni)
  bool get isNewAccount {
    final creationDate = _auth.currentUser?.metadata.creationTime;
    return creationDate != null && AppDateUtils.isWithinDays(creationDate, 7);
  }

  // Verifica se l'utente è stato attivo di recente (ultime 24 ore)
  bool get isRecentlyActive {
    final lastSignIn = _auth.currentUser?.metadata.lastSignInTime;
    return lastSignIn != null && AppDateUtils.isWithinHours(lastSignIn, 24);
  }

  Future<void> signIn(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      // Potremmo aggiungere qui la registrazione del timestamp di login
      await _updateLastLoginTime();
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      final lastLoginTime = AppDateUtils.getCurrentDateTime();
      await _firestoreService.updateUserLastLogin(
        _auth.currentUser!.uid,
        lastLoginTime,
      );
      await _auth.signOut();
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  // Metodo privato per aggiornare il timestamp dell'ultimo accesso
  Future<void> _updateLastLoginTime() async {
    final user = _auth.currentUser;
    if (user != null) {
      final timestamp = AppDateUtils.getCurrentDateTime();
      await _firestoreService.updateUserLastLogin(user.uid, timestamp);
    }
  }

  // Metodo per ottenere informazioni formattate sull'account
  Map<String, String> getUserActivityInfo() {
    return {
      'Ultimo accesso': lastSignInTime ?? 'Mai',
      'Account creato': creationTime ?? 'Data non disponibile',
      'Ultima attività': lastActivityTime ?? 'Nessuna attività',
      'Stato account': isAuthenticated ? 'Attivo' : 'Non autenticato',
    };
  }

  // Metodo per verificare se l'utente deve aggiornare la password
  bool shouldUpdatePassword() {
    final lastPasswordUpdate = _auth.currentUser?.metadata.creationTime;
    if (lastPasswordUpdate == null) return false;
    
    // Suggerisci il cambio password dopo 90 giorni
    return AppDateUtils.daysSince(lastPasswordUpdate) > 90;
  }
}