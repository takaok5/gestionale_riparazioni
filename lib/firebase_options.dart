import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return const FirebaseOptions(
      apiKey: 'AIzaSyA1nlZLwdGJcflqhUCut8UGsQ8BUP-5wSc',
      appId: '1:935968494394:web:ae8375c1911c525e277603',
      messagingSenderId: '935968494394',
      projectId: 'gestione-riparazioni-5486f',
      authDomain: 'gestione-riparazioni-5486f.firebaseapp.com',
      storageBucket: 'gestione-riparazioni-5486f.firebasestorage.app',
    );
  }
}
