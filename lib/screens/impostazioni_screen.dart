import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../models/impostazioni_colori.dart';
import '../services/firestore_service.dart';

import '../providers/app_state.dart';
import '../models/impostazioni_colori.dart';
import '../services/firestore_service.dart';

class ImpostazioniScreen extends StatefulWidget {
  const ImpostazioniScreen({Key? key}) : super(key: key);

  @override
  State<ImpostazioniScreen> createState() => _ImpostazioniScreenState();
}

class _ImpostazioniScreenState extends State<ImpostazioniScreen> {
  ImpostazioniColori? _impostazioni;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadImpostazioni();
  }

  Future<void> _loadImpostazioni() async {
    final firestoreService =
        Provider.of<FirestoreService>(context, listen: false);

    setState(() => _isLoading = true);
    try {
      final impostazioni = await firestoreService.getImpostazioniColori();
      setState(() => _impostazioni = impostazioni);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Impostazioni'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                ListTile(
                  title: const Text('Tema'),
                  subtitle: Text(
                    appState.themeMode == ThemeMode.system
                        ? 'Sistema'
                        : appState.themeMode == ThemeMode.light
                            ? 'Chiaro'
                            : 'Scuro',
                  ),
                  trailing: const Icon(Icons.brightness_medium),
                  onTap: _showThemePicker,
                ),
                if (_impostazioni != null) ...[
                  const Divider(),
                  _buildColorPicker(
                    'Colore primario',
                    _impostazioni!.colorePrimario,
                    (color) => _updateColor('colorePrimario', color),
                  ),
                  _buildColorPicker(
                    'Colore secondario',
                    _impostazioni!.coloreSecondario,
                    (color) => _updateColor('coloreSecondario', color),
                  ),
                  _buildColorPicker(
                    'Colore sfondo',
                    _impostazioni!.coloreSfondo,
                    (color) => _updateColor('coloreSfondo', color),
                  ),
                ],
              ],
            ),
    );
  }

  Widget _buildColorPicker(
    String title,
    Color currentColor,
    Function(Color) onColorChanged,
  ) {
    return ListTile(
      title: Text(title),
      trailing: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: currentColor,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey),
        ),
      ),
      onTap: () => _showColorPicker(title, currentColor, onColorChanged),
    );
  }

  Future<void> _showThemePicker() async {
    final appState = Provider.of<AppState>(context, listen: false);

    final selectedMode = await showDialog<ThemeMode>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Seleziona tema'),
        children: [
          _buildThemeOption(ThemeMode.system, 'Sistema'),
          _buildThemeOption(ThemeMode.light, 'Chiaro'),
          _buildThemeOption(ThemeMode.dark, 'Scuro'),
        ],
      ),
    );

    if (selectedMode != null) {
      await appState.setThemeMode(selectedMode);
    }
  }

  Widget _buildThemeOption(ThemeMode mode, String label) {
    return SimpleDialogOption(
      onPressed: () => Navigator.pop(context, mode),
      child: Text(label),
    );
  }

  Future<void> _showColorPicker(
    String title,
    Color currentColor,
    Function(Color) onColorChanged,
  ) async {
    // Implementa un color picker personalizzato o usa un package esistente
  }

  Future<void> _updateColor(String field, Color color) async {
    if (_impostazioni == null) return;

    final firestoreService =
        Provider.of<FirestoreService>(context, listen: false);

    try {
      final newImpostazioni = ImpostazioniColori(
        colorePrimario:
            field == 'colorePrimario' ? color : _impostazioni!.colorePrimario,
        coloreSecondario: field == 'coloreSecondario'
            ? color
            : _impostazioni!.coloreSecondario,
        coloreSfondo:
            field == 'coloreSfondo' ? color : _impostazioni!.coloreSfondo,
      );

      await firestoreService.salvaImpostazioniColori(newImpostazioni);
      setState(() => _impostazioni = newImpostazioni);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Errore: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
