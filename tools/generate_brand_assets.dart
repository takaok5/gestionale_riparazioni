import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:path/path.dart' as path;

Future<void> main() async {
  print('Starting brand assets generation...');

  // Ensure directories exist
  for (final dir in ['assets/images', 'assets/icons']) {
    final directory = Directory(dir);
    if (!await directory.exists()) {
      await directory.create(recursive: true);
    }
  }

  // Generate assets
  await generateLogo(
    outputPath: 'assets/images/splash.png',
    size: const Size(1080, 1080),
    isDark: false,
  );

  await generateLogo(
    outputPath: 'assets/images/splash_dark.png',
    size: const Size(1080, 1080),
    isDark: true,
  );

  await generateLogo(
    outputPath: 'assets/icons/app_icon.png',
    size: const Size(1024, 1024),
    isDark: false,
  );

  await generateLogo(
    outputPath: 'assets/icons/app_icon_foreground.png',
    size: const Size(512, 512),
    isDark: false,
  );

  print('Brand assets generated successfully!');
}

Future<void> generateLogo({
  required String outputPath,
  required Size size,
  bool isDark = false,
}) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  final rect = Offset.zero & size;

  // Background
  canvas.drawRect(
    rect,
    Paint()..color = isDark ? const Color(0xFF121212) : Colors.white,
  );

  // Logo text "Tech Care"
  final textPainter = TextPainter(
    text: TextSpan(
      text: 'Tech\nCare',
      style: TextStyle(
        fontSize: size.width * 0.2,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : const Color(0xFF2196F3),
        height: 1.2,
      ),
    ),
    textAlign: TextAlign.center,
    textDirection: TextDirection.ltr,
  );

  textPainter.layout(
    minWidth: 0,
    maxWidth: size.width,
  );

  textPainter.paint(
    canvas,
    Offset(
      (size.width - textPainter.width) / 2,
      (size.height - textPainter.height) / 2,
    ),
  );

  final picture = recorder.endRecording();
  final img = await picture.toImage(size.width.toInt(), size.height.toInt());
  final data = await img.toByteData(format: ui.ImageByteFormat.png);

  if (data != null) {
    await File(outputPath).writeAsBytes(data.buffer.asUint8List());
    print('Generated: $outputPath');
  }
}
