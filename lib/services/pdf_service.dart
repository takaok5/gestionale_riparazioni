import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'dart:io';

class PdfService {
  // Singleton pattern
  static final PdfService _instance = PdfService._internal();
  factory PdfService() => _instance;
  PdfService._internal();

  Future<File> generateGaranziaPdf(Map<String, dynamic> datiGaranzia) async {
    final pdf = pw.Document();

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
            _buildInfoRow('Data Inizio:', datiGaranzia['dataInizio']),
            _buildInfoRow('Data Scadenza:', datiGaranzia['dataScadenza']),
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

    // Salva il PDF
    final output = await getTemporaryDirectory();
    final file = File(
        '${output.path}/garanzia_${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(await pdf.save());

    return file;
  }

  Future<File> generateRicevutaRiparazione(
      Map<String, dynamic> datiRiparazione) async {
    final pdf = pw.Document();

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
            _buildInfoRow('Data:', datiRiparazione['dataCompletamento']),
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

    // Salva il PDF
    final output = await getTemporaryDirectory();
    final file = File(
        '${output.path}/ricevuta_${DateTime.now().millisecondsSinceEpoch}.pdf');
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
        // Righe dati
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

  pw.Widget _buildFooter() {
    return pw.Column(
      children: [
        pw.Divider(),
        pw.SizedBox(height: 10),
        pw.Text(
          'Documento generato automaticamente dal sistema',
          style: pw.TextStyle(
            fontSize: 8,
            color: PdfColors.grey,
          ),
        ),
      ],
    );
  }
}
