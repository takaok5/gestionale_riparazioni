import 'package:flutter/material.dart';
import '../routes/app_routes.dart';
import '../services/auth_service.dart';
import '../services/contabilita_service.dart';
import '../widgets/recent_activities.dart';
import '../models/activity.dart';

class HomeScreen extends StatefulWidget {
  final AuthService authService;
  final ContabilitaService contabilitaService;

  const HomeScreen({
    Key? key,
    required this.authService,
    required this.contabilitaService,
  }) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => widget.authService.signOut(),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatisticsCards(),
            const SizedBox(height: 24),
            _buildRecentActivities(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsCards() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      children: [
        _buildStatCard(
          'Riparazioni in corso',
          '12',
          Colors.blue,
          Icons.build,
          () => Navigator.pushNamed(context, '/riparazioni'),
        ),
        _buildStatCard(
          'Ricambi sotto scorta',
          '5',
          Colors.orange,
          Icons.warning,
          () => Navigator.pushNamed(context, '/magazzino'),
        ),
        _buildStatCard(
          'Ordini in attesa',
          '3',
          Colors.purple,
          Icons.shopping_cart,
          () => Navigator.pushNamed(context, '/ordini'),
        ),
        _buildStatCard(
          'Garanzie in scadenza',
          '2',
          Colors.red,
          Icons.event_busy,
          () => Navigator.pushNamed(context, '/garanzie'),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color color,
    IconData icon,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 32,
                color: color,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentActivities() {
    final activities = [
      Activity(
        id: '1',
        tipo: 'riparazione',
        titolo: 'Nuova riparazione',
        descrizione: 'iPhone 12 - Sostituzione display',
        timestamp: DateTime.now(),
        riferimentoId: '1',
        riferimentoTipo: 'riparazione',
        userId: 'current-user-id',
      ),
      Activity(
        id: '2',
        tipo: 'ordine',
        titolo: 'Ordine confermato',
        descrizione: 'Ordine #123 confermato da fornitore',
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        riferimentoId: '123',
        riferimentoTipo: 'ordine',
        userId: 'current-user-id',
      ),
    ];

    return RecentActivities(
      activities: activities,
      onActivityTap: (id) {
        // TODO: Implementare la navigazione ai dettagli dell'attività
      },
    );
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Colors.blue,
            ),
            child: Text(
              'Gestionale Riparazioni',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/home');
            },
          ),
          ListTile(
            leading: const Icon(Icons.build),
            title: const Text('Riparazioni'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/riparazioni');
            },
          ),
          ListTile(
            leading: const Icon(Icons.view_kanban),
            title: const Text('Kanban'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/kanban');
            },
          ),
          ListTile(
            leading: const Icon(Icons.inventory),
            title: const Text('Magazzino'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/magazzino');
            },
          ),
          ListTile(
            leading: const Icon(Icons.shopping_cart),
            title: const Text('Ordini'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/ordini');
            },
          ),
          ListTile(
            leading: const Icon(Icons.security),
            title: const Text('Garanzie'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/garanzie');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Impostazioni'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/impostazioni');
            },
          ),
        ],
      ),
    );
  }
}
