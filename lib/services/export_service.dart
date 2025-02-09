import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/cliente.dart';
import '../models/riparazione.dart';
import '../models/preventivo.dart';
import '../utils/date_utils.dart';
import './pdf_service.dart';

class ExportService {
  final PdfService _pdfService = PdfService();

  // Manteniamo il metodo esistente ma migliorato
  Future<String> exportToExcel({
    required List<Cliente> clienti,
    required List<Riparazione> riparazioni,
    required List<Preventivo> preventivi,
  }) async {
    final excel = Excel.createExcel();

    // Foglio Clienti
    final Sheet clientiSheet = excel['Clienti'];
    clientiSheet.insertRowIterables([
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
    ], 0);

    for (var i = 0; i < clienti.length; i++) {
      final cliente = clienti[i];
      clientiSheet.insertRowIterables([
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
      ], i + 1);
    }

    // Foglio Riparazioni
    final Sheet riparazioniSheet = excel['Riparazioni'];
    _setupRiparazioniSheet(riparazioniSheet, riparazioni);

    // Foglio Preventivi
    final Sheet preventiviSheet = excel['Preventivi'];
    _setupPreventiviSheet(preventiviSheet, preventivi);

    // Salva il file
    final directory = await getApplicationDocumentsDirectory();
    final String timestamp =
        DateTime.now().toIso8601String().replaceAll(':', '-');
    final file = File('${directory.path}/export_$timestamp.xlsx');
    await file.writeAsBytes(excel.encode()!);

    return file.path;
  }

  void _setupRiparazioniSheet(Sheet sheet, List<Riparazione> riparazioni) {
    sheet.insertRowIterables([
      'ID',
      'Cliente',
      'Dispositivo',
      'Stato',
      'Data Apertura',
      'Data Chiusura',
      'Tecnico',
      'Costo',
      'Note',
    ], 0);

    for (var i = 0; i < riparazioni.length; i++) {
      final riparazione = riparazioni[i];
      sheet.insertRowIterables([
        riparazione.id,
        riparazione.clienteId,
        riparazione.dispositivo,
        riparazione.stato.name,
        DateUtils.formatDateTime(riparazione.dataApertura),
        riparazione.dataChiusura != null
            ? DateUtils.formatDateTime(riparazione.dataChiusura!)
            : '',
        riparazione.tecnicoId ?? '',
        riparazione.costoTotale.toString(),
        riparazione.note ?? '',
      ], i + 1);
    }
  }

  void _setupPreventiviSheet(Sheet sheet, List<Preventivo> preventivi) {
    sheet.insertRowIterables([
      'ID',
      'Cliente',
      'Data',
      'Stato',
      'Importo',
      'Validità',
      'Note',
    ], 0);

    for (var i = 0; i < preventivi.length; i++) {
      final preventivo = preventivi[i];
      sheet.insertRowIterables([
        preventivo.id,
        preventivo.clienteId,
        DateUtils.formatDateTime(preventivo.dataEmissione),
        preventivo.stato.name,
        preventivo.importoTotale.toString(),
        DateUtils.formatDateTime(preventivo.dataScadenza),
        preventivo.note ?? '',
      ], i + 1);
    }
  }

  // Aggiungiamo i metodi per esportare in PDF usando il PdfService esistente
  Future<String> exportToPdf({
    List<Cliente>? clienti,
    List<Riparazione>? riparazioni,
    List<Preventivo>? preventivi,
  }) async {
    // Utilizziamo il PdfService esistente che è già ben strutturato
    final Map<String, dynamic> datiReport = {
      'dataGenerazione': DateTime.now(),
      'clienti': clienti,
      'riparazioni': riparazioni,
      'preventivi': preventivi,
    };

    final file = await _pdfService.generateRicevutaRiparazione(datiReport);
    return file.path;
  }
}
