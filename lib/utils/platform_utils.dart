import 'dart:io';
import 'package:flutter/foundation.dart';

class PlatformUtils {
  static bool get isWindows {
    return !kIsWeb && Platform.isWindows;
  }

  static bool get isDesktop {
    return !kIsWeb &&
        (Platform.isWindows || Platform.isMacOS || Platform.isLinux);
  }

  static bool get isMobile {
    return !kIsWeb && (Platform.isIOS || Platform.isAndroid);
  }

  static bool get isWeb {
    return kIsWeb;
  }
}
