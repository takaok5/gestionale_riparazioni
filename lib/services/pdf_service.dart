import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../utils/date_utils.dart' show AppDateUtils;

class PdfService {
  // Singleton pattern
  static final PdfService _instance = PdfService._internal();
  factory PdfService() => _instance;
  PdfService._internal();

  Future<File> generateGaranziaPdf(Map<String, dynamic> datiGaranzia) async {
    final pdf = pw.Document();
    final now = AppDateUtils.getCurrentDateTime();

    pdf.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Header(
              level: 0,
              child: pw.Text('Certificato di Garanzia'),
            ),
            pw.SizedBox(height: 20),
            _buildInfoRow('Cliente:', datiGaranzia['nomeCliente']),
            _buildInfoRow('Dispositivo:', datiGaranzia['dispositivo']),
            _buildInfoRow(
                'Data Inizio:',
                AppDateUtils.formatDateTime(
                    DateTime.parse(datiGaranzia['dataInizio']))),
            _buildInfoRow(
                'Data Scadenza:',
                AppDateUtils.formatDateTime(
                    DateTime.parse(datiGaranzia['dataScadenza']))),
            _buildInfoRow('Durata:',
                '${AppDateUtils.daysBetween(DateTime.parse(datiGaranzia['dataInizio']), DateTime.parse(datiGaranzia['dataScadenza']))} giorni'),
            pw.SizedBox(height: 20),
            pw.Text('Componenti coperti da garanzia:'),
            pw.SizedBox(height: 10),
            pw.BulletedList(
              items: List<String>.from(datiGaranzia['componentiCoperti'])
                  .map((c) => pw.Text(c))
                  .toList(),
            ),
            if (datiGaranzia['note'] != null) ...[
              pw.SizedBox(height: 20),
              pw.Text('Note:'),
              pw.Text(datiGaranzia['note']),
            ],
            pw.SizedBox(height: 40),
            _buildFooter(),
          ],
        ),
      ),
    );

    // Salva il PDF con timestamp formattato
    final output = await getTemporaryDirectory();
    final timestamp = AppDateUtils.formatFileTimestamp(now);
    final file = File('${output.path}/garanzia_$timestamp.pdf');
    await file.writeAsBytes(await pdf.save());

    return file;
  }

  Future<File> generateRicevutaRiparazione(
      Map<String, dynamic> datiRiparazione) async {
    final pdf = pw.Document();
    final now = AppDateUtils.getCurrentDateTime();
    final dataCompletamento =
        DateTime.parse(datiRiparazione['dataCompletamento']);

    pdf.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Header(
              level: 0,
              child: pw.Text('Ricevuta Riparazione'),
            ),
            pw.SizedBox(height: 20),
            _buildInfoRow('Cliente:', datiRiparazione['nomeCliente']),
            _buildInfoRow('Dispositivo:', datiRiparazione['dispositivo']),
            _buildInfoRow('Data Completamento:',
                AppDateUtils.formatDateTime(dataCompletamento)),
            _buildInfoRow('Tempo Trascorso:',
                '${AppDateUtils.daysBetween(dataCompletamento, now)} giorni fa'),
            pw.SizedBox(height: 20),
            pw.Text('Interventi effettuati:'),
            pw.SizedBox(height: 10),
            pw.BulletedList(
              items: List<String>.from(datiRiparazione['interventi'])
                  .map((i) => pw.Text(i))
                  .toList(),
            ),
            pw.SizedBox(height: 20),
            pw.Text('Ricambi utilizzati:'),
            _buildRicambiTable(datiRiparazione['ricambi']),
            pw.SizedBox(height: 20),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Totale:'),
                pw.Text('€ ${datiRiparazione['totale'].toStringAsFixed(2)}'),
              ],
            ),
            pw.SizedBox(height: 40),
            _buildFooter(),
          ],
        ),
      ),
    );

    // Salva il PDF con timestamp formattato
    final output = await getTemporaryDirectory();
    final timestamp = AppDateUtils.formatFileTimestamp(now);
    final file = File('${output.path}/ricevuta_$timestamp.pdf');
    await file.writeAsBytes(await pdf.save());

    return file;
  }

  Future<File> generateReportPeriodico(Map<String, dynamic> datiReport) async {
    final pdf = pw.Document();
    final now = AppDateUtils.getCurrentDateTime();
    final inizioPeriodo = DateTime.parse(datiReport['inizioPeriodo']);
    final finePeriodo = DateTime.parse(datiReport['finePeriodo']);

    pdf.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Header(
              level: 0,
              child: pw.Text('Report Periodico'),
            ),
            pw.SizedBox(height: 20),
            _buildInfoRow('Periodo:',
                '${AppDateUtils.formatDate(inizioPeriodo)} - ${AppDateUtils.formatDate(finePeriodo)}'),
            _buildInfoRow('Durata:',
                '${AppDateUtils.daysBetween(inizioPeriodo, finePeriodo)} giorni'),
            _buildStatistichePeriodo(datiReport['statistiche']),
            pw.SizedBox(height: 40),
            _buildFooter(generatedAt: now),
          ],
        ),
      ),
    );

    // Salva il PDF con periodo nel nome
    final output = await getTemporaryDirectory();
    final periodoString =
        '${AppDateUtils.formatYearMonth(inizioPeriodo)}_${AppDateUtils.formatYearMonth(finePeriodo)}';
    final file = File('${output.path}/report_$periodoString.pdf');
    await file.writeAsBytes(await pdf.save());

    return file;
  }

  pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        children: [
          pw.Text(
            label,
            style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(width: 8),
          pw.Text(value),
        ],
      ),
    );
  }

  pw.Widget _buildRicambiTable(List<Map<String, dynamic>> ricambi) {
    return pw.Table(
      border: pw.TableBorder.all(),
      children: [
        // Intestazione
        pw.TableRow(
          children: [
            pw.Padding(
              padding: const pw.EdgeInsets.all(4),
              child: pw.Text('Descrizione'),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(4),
              child: pw.Text('Quantità'),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.all(4),
              child: pw.Text('Prezzo'),
            ),
          ],
        ),
        ...ricambi.map((r) => pw.TableRow(
              children: [
                pw.Padding(
                  padding: const pw.EdgeInsets.all(4),
                  child: pw.Text(r['descrizione']),
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.all(4),
                  child: pw.Text(r['quantita'].toString()),
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.all(4),
                  child: pw.Text('€ ${r['prezzo'].toStringAsFixed(2)}'),
                ),
              ],
            )),
      ],
    );
  }

  pw.Widget _buildStatistichePeriodo(Map<String, dynamic> statistiche) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(height: 20),
        pw.Text('Statistiche del periodo:'),
        pw.SizedBox(height: 10),
        ...statistiche.entries
            .map((entry) => _buildInfoRow(entry.key, entry.value.toString())),
      ],
    );
  }

  pw.Widget _buildFooter({DateTime? generatedAt}) {
    final now = generatedAt ?? AppDateUtils.getCurrentDateTime();
    return pw.Column(
      children: [
        pw.Divider(),
        pw.SizedBox(height: 10),
        pw.Text(
          'Documento generato il ${AppDateUtils.formatDateTime(now)}',
          style: pw.TextStyle(
            fontSize: 8,
            color: PdfColors.grey,
          ),
        ),
      ],
    );
  }
}
