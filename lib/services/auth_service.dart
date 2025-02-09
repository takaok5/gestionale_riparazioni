import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_profile.dart';
import '../utils/exceptions.dart';

class AuthService {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();

  factory AuthService() {
    return _instance;
  }

  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Auth state stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Current user
  User? get currentUser => _auth.currentUser;

  // Is user signed in
  bool get isSignedIn => currentUser != null;

  // Get current user profile
  Future<UserProfile?> getCurrentUserProfile() async {
    try {
      final user = currentUser;
      if (user == null) return null;

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (!doc.exists) {
        throw AuthException(
          'Profilo utente non trovato',
          code: 'profile-not-found',
          details: {'uid': user.uid},
        );
      }

      return UserProfile.fromMap({
        ...doc.data()!,
        'id': doc.id,
      });
    } on FirebaseException catch (e) {
      throw AuthException(
        'Errore nel recupero del profilo utente',
        code: e.code,
        details: e.message,
      );
    }
  }

  // Sign in with email and password
  Future<UserProfile> signIn(String email, String password) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = userCredential.user;
      if (user == null) {
        throw AuthException('Login fallito: nessun utente trovato');
      }

      final profile = await getCurrentUserProfile();
      if (profile == null) {
        throw AuthException('Profilo utente non trovato dopo il login');
      }

      return profile;
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        _getAuthErrorMessage(e.code),
        code: e.code,
        details: e.message,
      );
    }
  }

  // Sign up with email and password
  Future<UserProfile> signUp(
      String email, String password, UserProfile profile) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final user = userCredential.user;
      if (user == null) {
        throw AuthException('Registrazione fallita: nessun utente creato');
      }

      // Create user profile
      await _firestore.collection('users').doc(user.uid).set({
        ...profile.toMap(),
        'email': email,
        'createdAt': FieldValue.serverTimestamp(),
      });

      return profile.copyWith(id: user.uid);
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        _getAuthErrorMessage(e.code),
        code: e.code,
        details: e.message,
      );
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        'Errore durante il logout',
        code: e.code,
        details: e.message,
      );
    }
  }

  // Update user profile
  Future<void> updateProfile(UserProfile profile) async {
    try {
      final user = currentUser;
      if (user == null) {
        throw AuthException('Nessun utente autenticato');
      }

      await _firestore
          .collection('users')
          .doc(profile.id)
          .update(profile.toMap());
    } on FirebaseException catch (e) {
      throw AuthException(
        'Errore durante l\'aggiornamento del profilo',
        code: e.code,
        details: e.message,
      );
    }
  }

  // Change password
  Future<void> changePassword(
      String currentPassword, String newPassword) async {
    try {
      final user = currentUser;
      if (user == null || user.email == null) {
        throw AuthException('Nessun utente autenticato');
      }

      // Re-authenticate user
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(credential);

      // Change password
      await user.updatePassword(newPassword);
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        _getAuthErrorMessage(e.code),
        code: e.code,
        details: e.message,
      );
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        _getAuthErrorMessage(e.code),
        code: e.code,
        details: e.message,
      );
    }
  }

  // Delete account
  Future<void> deleteAccount(String password) async {
    try {
      final user = currentUser;
      if (user == null || user.email == null) {
        throw AuthException('Nessun utente autenticato');
      }

      // Re-authenticate user
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: password,
      );
      await user.reauthenticateWithCredential(credential);

      // Delete user data
      await _firestore.collection('users').doc(user.uid).delete();

      // Delete auth account
      await user.delete();
    } on FirebaseAuthException catch (e) {
      throw AuthException(
        _getAuthErrorMessage(e.code),
        code: e.code,
        details: e.message,
      );
    }
  }

  // Helper method to get user-friendly error messages
  String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'Nessun utente trovato con questa email';
      case 'wrong-password':
        return 'Password non corretta';
      case 'email-already-in-use':
        return 'Email già in uso';
      case 'weak-password':
        return 'La password deve essere di almeno 6 caratteri';
      case 'invalid-email':
        return 'Email non valida';
      case 'user-disabled':
        return 'Account disabilitato';
      case 'too-many-requests':
        return 'Troppi tentativi. Riprova più tardi';
      case 'operation-not-allowed':
        return 'Operazione non consentita';
      case 'requires-recent-login':
        return 'Per favore, effettua nuovamente il login';
      default:
        return 'Si è verificato un errore durante l\'autenticazione';
    }
  }
}
