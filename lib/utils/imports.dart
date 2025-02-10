// Material Design
export 'package:flutter/material.dart' hide TextDirection;

// Firebase
export 'package:cloud_firestore/cloud_firestore.dart';
export 'package:firebase_auth/firebase_auth.dart';
export 'package:firebase_core/firebase_core.dart';
export 'package:firebase_messaging/firebase_messaging.dart';

// Packages di terze parti
export 'package:flutter_local_notifications/flutter_local_notifications.dart';
export 'package:timeago/timeago.dart';
export 'package:fl_chart/fl_chart.dart';
export 'package:intl/intl.dart';

// Models - Base
export '../models/base_model.dart';

// Models - Core
export '../models/activity.dart';
export '../models/categoria.dart';
export '../models/cliente.dart';
export '../models/contatto.dart';
export '../models/dettagli_contabili.dart';
export '../models/preventivo.dart';

// Models - Riparazioni
export '../models/riparazione.dart' hide StatoRiparazione, TipoRiparazione;
export '../models/garanzia.dart';
export '../models/tipo_riparazione.dart' hide TipoRiparazione;

// Models - Magazzino
export '../models/movimento_magazzino.dart';
export '../models/ricambio.dart';
export '../models/ricambio_ordinato.dart';

// Models - Ordini
export '../models/ordine.dart' hide StatoOrdine;
export '../models/ordine_ricambi.dart' hide RicambioOrdine;

// Models - Altri
export '../models/fornitore.dart';
export '../models/user_profile.dart';
export '../models/impostazioni_colori.dart';

// Enums
export '../models/enums/index.dart';

// Services
export '../services/auth_service.dart';
export '../services/contabilita_service.dart';
export '../services/firestore_service.dart';
export '../services/fornitori_service.dart';
export '../services/inventory_service.dart';
export '../services/notification_service.dart';
export '../services/garanzia_service.dart';
export '../services/ordini_service.dart';

// Providers
export '../providers/app_state.dart';
export '../providers/settings_provider.dart';

// Widgets
export '../widgets/riparazione_card.dart';
export '../widgets/form_nuova_richiesta.dart';
export '../widgets/form_appuntamento.dart';
export '../widgets/garanzia_form.dart';
export '../widgets/fornitore_form.dart';
export '../widgets/ordine_form.dart' hide RicambioOrdine;
export '../widgets/ricambio_form.dart';
export '../widgets/recent_activities.dart';

// Utils
export '../utils/form_validators.dart';
export '../utils/date_formatter.dart';
export '../utils/error_handler.dart';
export '../utils/date_utils.dart' show AppDateUtils;
