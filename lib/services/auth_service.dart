import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_profile.dart';
import '../utils/exceptions.dart';


class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirestoreService _firestoreService;

  AuthService(this._firestoreService);

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<UserProfile?> getCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return null;

    final userProfile = await _firestoreService.getUserProfile(user.uid);
    return userProfile;
  }

  Future<UserCredential> signInWithEmailAndPassword(
    String email, 
    String password,
  ) async {
    return await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }
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
