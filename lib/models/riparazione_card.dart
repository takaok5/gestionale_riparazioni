import 'package:flutter/material.dart';
import '../models/riparazione.dart';
import '../utils/date_formatter.dart';

class RiparazioneCard extends StatelessWidget {
  final Riparazione riparazione;
  final VoidCallback onTap;

  const RiparazioneCard({
    Key? key,
    required this.riparazione,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    riparazione.tipo,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: riparazione.stato.color.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      riparazione.stato.display,
                      style: TextStyle(
                        color: riparazione.stato.color,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                riparazione.descrizione,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              if (riparazione.appuntamento != null) ...[
                Text(
                  'Appuntamento: ${DateFormatter.formatDateTime(riparazione.appuntamento!)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ingresso: ${DateFormatter.formatDate(riparazione.dataIngresso)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  if (riparazione.prezzo > 0)
                    Text(
                      '€ ${riparazione.costoFinale?.toStringAsFixed(2) ?? '-'}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}