import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.windows: // Aggiunto supporto Windows
        return web; // Usa le stesse configurazioni del web per Windows
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static final FirebaseOptions web = FirebaseOptions( // Rimosso const ridondante
    apiKey: String.fromEnvironment('AIzaSyBa0HMvzctZ-Xt-z2uEFxJelBtcQEcS-Zc'),
    appId: String.fromEnvironment('1:16059806186:web:b20864941d6a46dbbf4293'),
    messagingSenderId: String.fromEnvironment('16059806186'),
    projectId: String.fromEnvironment('gestionale-riparazioni'),
    authDomain: String.fromEnvironment('gestionale-riparazioni.firebaseapp.com'),
    storageBucket: String.fromEnvironment('gestionale-riparazioni.firebasestorage.app'),
  );

  static final FirebaseOptions android = FirebaseOptions( // Rimosso const ridondante
    apiKey: String.fromEnvironment('FIREBASE_ANDROID_API_KEY'),
    appId: String.fromEnvironment('FIREBASE_ANDROID_APP_ID'),
    messagingSenderId: String.fromEnvironment('FIREBASE_SENDER_ID'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
  );

  static final FirebaseOptions ios = FirebaseOptions( // Rimosso const ridondante
    apiKey: String.fromEnvironment('FIREBASE_IOS_API_KEY'),
    appId: String.fromEnvironment('FIREBASE_IOS_APP_ID'),
    messagingSenderId: String.fromEnvironment('FIREBASE_SENDER_ID'),
    projectId: String.fromEnvironment('FIREBASE_PROJECT_ID'),
    storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
    iosClientId: String.fromEnvironment('FIREBASE_IOS_CLIENT_ID'),
    iosBundleId: String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID'),
  );
}