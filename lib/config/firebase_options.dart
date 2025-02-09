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
      case TargetPlatform.windows:
        return web;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBa0HMvzctZ-Xt-z2uEFxJelBtcQEcS-Zc',
    appId: '1:16059806186:web:b20864941d6a46dbbf4293',
    messagingSenderId: '16059806186',
    projectId: 'gestionale-riparazioni',
    authDomain: 'gestionale-riparazioni.firebaseapp.com',
    storageBucket: 'gestionale-riparazioni.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'FIREBASE_ANDROID_API_KEY',
    appId: 'FIREBASE_ANDROID_APP_ID',
    messagingSenderId: 'FIREBASE_SENDER_ID',
    projectId: 'FIREBASE_PROJECT_ID',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'FIREBASE_IOS_API_KEY',
    appId: 'FIREBASE_IOS_APP_ID',
    messagingSenderId: 'FIREBASE_SENDER_ID',
    projectId: 'FIREBASE_PROJECT_ID',
    storageBucket: 'FIREBASE_STORAGE_BUCKET',
    iosClientId: 'FIREBASE_IOS_CLIENT_ID',
    iosBundleId: 'FIREBASE_IOS_BUNDLE_ID',
  );
}
