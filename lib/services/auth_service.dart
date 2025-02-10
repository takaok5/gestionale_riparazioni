import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_profile.dart';
import '../services/firestore_service.dart';
import '../utils/date_utils.dart' show AppDateUtils;

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirestoreService _firestoreService;

  // Nuovi campi per il tracciamento temporale
  DateTime? _lastSignIn;
  DateTime? _lastSignOut;
  Map<String, DateTime> _lastAuthOperations = {};
  int _maxPasswordAge = 90; // giorni
  int _sessionTimeout = 30; // minuti

  AuthService(this._firestoreService);

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Nuovi getters per le informazioni temporali
  String? get lastSignInFormatted =>
      _lastSignIn != null ? AppDateUtils.formatDateTime(_lastSignIn!) : null;

  String? get lastSignOutFormatted =>
      _lastSignOut != null ? AppDateUtils.formatDateTime(_lastSignOut!) : null;

  bool get isSessionExpired =>
      _lastSignIn != null &&
      AppDateUtils.minutesSince(_lastSignIn!) > _sessionTimeout;

  Future<UserProfile?> getCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    final userProfile = await _firestoreService.getUserProfile(user.uid);

    if (userProfile != null) {
      _recordAuthOperation('getUserProfile');
    }

    return userProfile;
  }

  Future<UserCredential> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );

    _lastSignIn = AppDateUtils.getCurrentDateTime();
    _recordAuthOperation('signIn');

    // Aggiorna il timestamp di accesso nel profilo
    if (credential.user != null) {
      await _firestore.collection('users').doc(credential.user!.uid).update({
        'lastSignIn': AppDateUtils.toUtc(_lastSignIn!),
        'lastSignInFormatted': AppDateUtils.formatDateTime(_lastSignIn!),
      });
    }

    return credential;
  }

  Future<UserCredential> createUserWithEmailAndPassword({
    required String email,
    required String password,
    required UserProfile profile,
  }) async {
    try {
      final now = AppDateUtils.getCurrentDateTime();
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (userCredential.user != null) {
        await _firestore.collection('users').doc(userCredential.user!.uid).set({
          ...profile.toMap(),
          'email': email,
          'createdAt': AppDateUtils.toUtc(now),
          'createdAtFormatted': AppDateUtils.formatDateTime(now),
          'updatedAt': AppDateUtils.toUtc(now),
          'updatedAtFormatted': AppDateUtils.formatDateTime(now),
          'passwordLastChanged': AppDateUtils.toUtc(now),
          'passwordExpiresAt':
              AppDateUtils.toUtc(AppDateUtils.addDays(now, _maxPasswordAge)),
        });

        _recordAuthOperation('createUser');
      }

      return userCredential;
    } catch (e) {
      _recordAuthOperation('createUserError');
      rethrow;
    }
  }

  Future<void> updateUserProfile(UserProfile profile) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('No user logged in');

    final now = AppDateUtils.getCurrentDateTime();
    await _firestore.collection('users').doc(user.uid).update({
      ...profile.toMap(),
      'updatedAt': AppDateUtils.toUtc(now),
      'updatedAtFormatted': AppDateUtils.formatDateTime(now),
    });

    _recordAuthOperation('updateProfile');
  }

  Future<void> signOut() async {
    _lastSignOut = AppDateUtils.getCurrentDateTime();
    await _auth.signOut();
    _recordAuthOperation('signOut');
  }

  Future<void> resetPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email);
    _recordAuthOperation('resetPassword');
  }

  Future<void> updatePassword(String newPassword) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('No user logged in');

    await user.updatePassword(newPassword);

    final now = AppDateUtils.getCurrentDateTime();
    await _firestore.collection('users').doc(user.uid).update({
      'passwordLastChanged': AppDateUtils.toUtc(now),
      'passwordLastChangedFormatted': AppDateUtils.formatDateTime(now),
      'passwordExpiresAt':
          AppDateUtils.toUtc(AppDateUtils.addDays(now, _maxPasswordAge)),
    });

    _recordAuthOperation('updatePassword');
  }

  Future<void> deleteAccount() async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('No user logged in');

    await _firestore.collection('users').doc(user.uid).delete();
    await user.delete();
    _recordAuthOperation('deleteAccount');
  }

  // Nuovi metodi per la gestione della sicurezza e del tracciamento

  void _recordAuthOperation(String operation) {
    _lastAuthOperations[operation] = AppDateUtils.getCurrentDateTime();
  }

  Future<bool> isPasswordExpired() async {
    final user = _auth.currentUser;
    if (user == null) return false;

    final userData = await _firestore.collection('users').doc(user.uid).get();
    if (!userData.exists) return false;

    final passwordLastChanged =
        userData.data()?['passwordLastChanged'] as Timestamp?;
    if (passwordLastChanged == null) return true;

    final daysSinceChange =
        AppDateUtils.daysSince(passwordLastChanged.toDate());
    return daysSinceChange >= _maxPasswordAge;
  }

  Future<Map<String, String>> getUserAuthStats() async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('No user logged in');

    final userData = await _firestore.collection('users').doc(user.uid).get();
    final data = userData.data() ?? {};

    return {
      'Email': user.email ?? 'N/A',
      'Ultimo accesso': lastSignInFormatted ?? 'Mai',
      'Ultimo logout': lastSignOutFormatted ?? 'Mai',
      'Account creato il': data['createdAtFormatted'] ?? 'N/A',
      'Ultima modifica password': data['passwordLastChangedFormatted'] ?? 'Mai',
      'Password scade il': data['passwordExpiresAt'] != null
          ? AppDateUtils.formatDateTime(
              (data['passwordExpiresAt'] as Timestamp).toDate())
          : 'N/A',
      'Sessione scade tra': _lastSignIn != null
          ? '${_sessionTimeout - AppDateUtils.minutesSince(_lastSignIn!)} minuti'
          : 'N/A',
    };
  }

  Map<String, String> getAuthOperationsLog() {
    Map<String, String> log = {};
    _lastAuthOperations.forEach((operation, timestamp) {
      log[operation] = AppDateUtils.formatDateTime(timestamp);
    });
    return log;
  }

  void setSessionTimeout(int minutes) {
    _sessionTimeout = minutes;
  }

  void setMaxPasswordAge(int days) {
    _maxPasswordAge = days;
  }
}
