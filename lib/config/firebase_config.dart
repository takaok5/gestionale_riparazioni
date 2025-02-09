import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../utils/platform_utils.dart';
import 'firebase_options.dart';

class FirebaseConfig {
  static bool _initialized = false;

  /// Inizializza Firebase con le configurazioni appropriate per la piattaforma
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );

      // Configurazioni specifiche per Windows
      if (PlatformUtils.isWindows) {
        FirebaseFirestore.instance.settings = const Settings(
          persistenceEnabled: true,
          cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
          sslEnabled: true,
        );
      }

      // Configurazioni per modalità debug
      if (kDebugMode) {
        FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
      }

      _initialized = true;
    } catch (e, stackTrace) {
      debugPrint('Errore durante l\'inizializzazione di Firebase: $e');
      debugPrint(stackTrace.toString());
      rethrow;
    }
  }

  /// Getter per Firestore con controllo di inizializzazione
  static FirebaseFirestore get firestore {
    if (!_initialized) {
      throw StateError(
          'Firebase non è stato inizializzato. Chiamare initialize() prima di usare firestore.');
    }
    return FirebaseFirestore.instance;
  }

  /// Verifica lo stato della connessione a Firestore
  static Stream<bool> get connectionState {
    return FirebaseFirestore.instance
        .collection('system')
        .doc('status')
        .snapshots()
        .map((_) => true)
        .handleError((_) => false);
  }

  /// Pulisce la cache locale di Firestore
  static Future<void> clearCache() async {
    if (PlatformUtils.isWindows) {
      try {
        await FirebaseFirestore.instance.clearPersistence();
      } catch (e) {
        debugPrint('Errore durante la pulizia della cache: $e');
        rethrow;
      }
    }
  }

  /// Abilita/disabilita la persistenza offline
  static Future<void> setPersistence(bool enabled) async {
    if (PlatformUtils.isWindows) {
      try {
        await FirebaseFirestore.instance.settings = const Settings(
          persistenceEnabled: enabled,
          cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
          sslEnabled: true,
);
      } catch (e) {
        debugPrint('Errore durante la configurazione della persistenza: $e');
        rethrow;
      }
    }
  }
}
