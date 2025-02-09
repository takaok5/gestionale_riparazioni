import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

Future<void> main() async {
  print('Starting assets setup...');

  // Verifica/crea directories
  final directories = [
    'assets/images',
    'assets/icons',
    'assets/fonts',
    'assets/translations',
  ];

  for (final dir in directories) {
    final directory = Directory(dir);
    if (!await directory.exists()) {
      await directory.create(recursive: true);
      print('Created directory: $dir');
    }
  }

  // Download Roboto fonts
  final fonts = {
    'Roboto-Regular.ttf': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
    'Roboto-Medium.ttf': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf',
    'Roboto-Bold.ttf': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
  };

  for (final font in fonts.entries) {
    final file = File(path.join('assets/fonts', font.key));
    if (!await file.exists()) {
      print('Downloading ${font.key}...');
      final response = await http.get(Uri.parse(font.value));
      await file.writeAsBytes(response.bodyBytes);
      print('Downloaded: ${font.key}');
    }
  }

  print('\nSetup completed!');
}