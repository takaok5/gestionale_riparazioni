import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/cliente.dart';
import '../models/riparazione.dart';
import '../models/preventivo.dart';
import '../utils/date_utils.dart' show AppDateUtils;
import './pdf_service.dart';

class ExportService {
  final PdfService _pdfService = PdfService();

  Future<String> exportToExcel({
    required List<Cliente> clienti,
    required List<Riparazione> riparazioni,
    required List<Preventivo> preventivi,
  }) async {
    final excel = Excel.createExcel();
    final now = AppDateUtils.getCurrentDateTime();

    // Foglio Clienti
    final Sheet clientiSheet = excel['Clienti'];
    _setupClientiSheet(clientiSheet, clienti);

    // Foglio Riparazioni
    final Sheet riparazioniSheet = excel['Riparazioni'];
    _setupRiparazioniSheet(riparazioniSheet, riparazioni);

    // Foglio Preventivi
    final Sheet preventiviSheet = excel['Preventivi'];
    _setupPreventiviSheet(preventiviSheet, preventivi);

    // Foglio Metadati Export
    final Sheet metadataSheet = excel['Metadata'];
    _setupMetadataSheet(metadataSheet, {
      'Data Esportazione': AppDateUtils.formatDateTime(now),
      'Numero Clienti': clienti.length,
      'Numero Riparazioni': riparazioni.length,
      'Numero Preventivi': preventivi.length,
      'Periodo':
          '${AppDateUtils.formatDate(now)} - ${AppDateUtils.formatDate(now)}',
    });

    // Salva il file con nome formattato
    final directory = await getApplicationDocumentsDirectory();
    final String timestamp = AppDateUtils.formatFileTimestamp(now);
    final file = File('${directory.path}/export_$timestamp.xlsx');
    await file.writeAsBytes(excel.encode()!);

    return file.path;
  }

  void _setupClientiSheet(Sheet sheet, List<Cliente> clienti) {
    sheet.insertRowIterables([
      'ID',
      'Nome',
      'Cognome',
      'Telefono',
      'Email',
      'Codice Fiscale',
      'Partita IVA',
      'PEC',
      'Stato',
      'Note',
      'Data Registrazione',
      'Ultimo Aggiornamento',
    ], 0);

    for (var i = 0; i < clienti.length; i++) {
      final cliente = clienti[i];
      sheet.insertRowIterables([
        cliente.id,
        cliente.nome,
        cliente.cognome,
        cliente.telefono,
        cliente.email ?? '',
        cliente.codiceFiscale ?? '',
        cliente.partitaIva ?? '',
        cliente.pec ?? '',
        cliente.stato.name,
        cliente.note ?? '',
        AppDateUtils.formatDateTime(cliente.dataRegistrazione),
        AppDateUtils.formatDateTime(cliente.ultimoAggiornamento),
      ], i + 1);
    }
  }

  void _setupRiparazioniSheet(Sheet sheet, List<Riparazione> riparazioni) {
    sheet.insertRowIterables([
      'ID',
      'Cliente',
      'Dispositivo',
      'Stato',
      'Data Apertura',
      'Data Chiusura',
      'Durata (giorni)',
      'Tecnico',
      'Costo',
      'Note',
      'Data Ultimo Aggiornamento',
    ], 0);

    for (var i = 0; i < riparazioni.length; i++) {
      final riparazione = riparazioni[i];
      final durataGiorni = riparazione.dataChiusura != null
          ? AppDateUtils.daysBetween(
              riparazione.dataApertura, riparazione.dataChiusura!)
          : AppDateUtils.daysSince(riparazione.dataApertura);

      sheet.insertRowIterables([
        riparazione.id,
        riparazione.clienteId,
        riparazione.dispositivo,
        riparazione.stato.name,
        AppDateUtils.formatDateTime(riparazione.dataApertura),
        riparazione.dataChiusura != null
            ? AppDateUtils.formatDateTime(riparazione.dataChiusura!)
            : 'In corso',
        durataGiorni.toString(),
        riparazione.tecnicoId ?? '',
        riparazione.costoTotale.toString(),
        riparazione.note ?? '',
        AppDateUtils.formatDateTime(riparazione.ultimoAggiornamento),
      ], i + 1);
    }
  }

  void _setupPreventiviSheet(Sheet sheet, List<Preventivo> preventivi) {
    sheet.insertRowIterables([
      'ID',
      'Cliente',
      'Data Emissione',
      'Data Scadenza',
      'Giorni alla Scadenza',
      'Stato',
      'Importo',
      'Note',
      'Ultimo Aggiornamento',
    ], 0);

    final now = AppDateUtils.getCurrentDateTime();

    for (var i = 0; i < preventivi.length; i++) {
      final preventivo = preventivi[i];
      final giorniAllaScadenza =
          AppDateUtils.daysBetween(now, preventivo.dataScadenza);

      sheet.insertRowIterables([
        preventivo.id,
        preventivo.clienteId,
        AppDateUtils.formatDateTime(preventivo.dataEmissione),
        AppDateUtils.formatDateTime(preventivo.dataScadenza),
        giorniAllaScadenza.toString(),
        preventivo.stato.name,
        preventivo.importoTotale.toString(),
        preventivo.note ?? '',
        AppDateUtils.formatDateTime(preventivo.ultimoAggiornamento),
      ], i + 1);
    }
  }

  void _setupMetadataSheet(Sheet sheet, Map<String, dynamic> metadata) {
    metadata.forEach((key, value) {
      sheet.insertRowIterables([key, value.toString()], sheet.maxRows);
    });
  }

  Future<String> exportToPdf({
    List<Cliente>? clienti,
    List<Riparazioni>? riparazioni,
    List<Preventivo>? preventivi,
    String? titoloReport,
  }) async {
    final now = AppDateUtils.getCurrentDateTime();

    final Map<String, dynamic> datiReport = {
      'dataGenerazione': now,
      'dataGenerazioneFormatted': AppDateUtils.formatDateTime(now),
      'periodoReport': {
        'inizio': AppDateUtils.formatDate(AppDateUtils.startOfMonth(now)),
        'fine': AppDateUtils.formatDate(AppDateUtils.endOfMonth(now)),
      },
      'clienti': clienti,
      'riparazioni': riparazioni,
      'preventivi': preventivi,
      'titolo': titoloReport ?? 'Report ${AppDateUtils.formatDate(now)}',
      'timestamp': AppDateUtils.formatFileTimestamp(now),
    };

    final file = await _pdfService.generateRicevutaRiparazione(datiReport);
    return file.path;
  }

  // Nuovo metodo per export periodico
  Future<Map<String, String>> exportPeriodico(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final now = AppDateUtils.getCurrentDateTime();
    final fileTimestamp = AppDateUtils.formatFileTimestamp(now);
    final period =
        '${AppDateUtils.formatDate(startDate)}_${AppDateUtils.formatDate(endDate)}';

    final files = <String, String>{};

    // Excel export
    final excelPath = await exportToExcel(/* ... */);
    files['excel'] = excelPath;

    // PDF export
    final pdfPath = await exportToPdf(
      titoloReport: 'Report Periodo: $period',
      /* ... */
    );
    files['pdf'] = pdfPath;

    return files;
  }
}
