import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/activity.dart';
import '../services/firestore_service.dart';
import '../utils/date_formatter.dart';

class RecentActivities extends StatelessWidget {
  final List<Activity> activities;
  final Function(String)? onActivityTap;

  const RecentActivities({
    Key? key,
    required this.activities,
    this.onActivityTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Attività Recenti',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Divider(),
          if (activities.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: Text('Nessuna attività recente'),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activities.length,
              itemBuilder: (context, index) {
                final activity = activities[index];
                return ListTile(
                  leading: _getIconForActivityType(activity.tipo),
                  title: Text(activity.titolo),
                  subtitle: Text(activity.descrizione),
                  trailing: Text(
                    DateFormatter.formatRelativeDate(activity.timestamp),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  onTap: activity.riferimentoId != null
                      ? () => onActivityTap?.call(activity.riferimentoId!)
                      : null,
                );
              },
            ),
        ],
      ),
    );
  }

  Icon _getIconForActivityType(String tipo) {
    switch (tipo) {
      case 'riparazione':
        return const Icon(Icons.build);
      case 'garanzia':
        return const Icon(Icons.security);
      case 'ordine':
        return const Icon(Icons.shopping_cart);
      case 'magazzino':
        return const Icon(Icons.inventory);
      default:
        return const Icon(Icons.notifications);
    }
  }
}
