import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import '../../auth/screens/login_screen.dart';
import '../../auth/screens/register_screen.dart';
import '../../host/screens/host_home_screen.dart';
import '../../host/screens/properties_screen.dart';
import '../../host/screens/add_property_screen.dart';
import '../../host/screens/request_cleaning_screen.dart';
import '../../host/screens/booking_detail_screen.dart';
import '../../host/screens/bookings_list_screen.dart';
import '../../host/screens/host_profile_screen.dart';

class AppRouter {
  final WidgetRef ref;

  AppRouter(this.ref);

  late final router = GoRouter(
    initialLocation: '/',
    refreshListenable: _RouterRefreshNotifier(ref),
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      // 1. Auth Guard
      if (authState.status == AuthStatus.loggedOut) {
        return loggingIn ? null : '/login';
      }

      // 2. Redirect from login if already authenticated
      if (loggingIn && authState.status == AuthStatus.authenticated) {
        return authState.user?.isHost == true ? '/host/home' : '/cleaner/home';
      }

      // 3. Root redirect
      if (state.matchedLocation == '/') {
        return authState.user?.isHost == true ? '/host/home' : '/cleaner/home';
      }

      // 4. Role Guards
      final isHostPath = state.matchedLocation.startsWith('/host');
      final isCleanerPath = state.matchedLocation.startsWith('/cleaner');

      if (isHostPath && authState.user?.isCleaner == true) {
        return '/cleaner/home';
      }
      if (isCleanerPath && authState.user?.isHost == true) {
        return '/host/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const Scaffold(body: Center(child: CircularProgressIndicator()))),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => RegisterScreen(initialRole: state.uri.queryParameters['role'] ?? 'host')),

      // Host Routes
      GoRoute(path: '/host/home', builder: (context, state) => const HostHomeScreen()),
      GoRoute(path: '/host/properties', builder: (context, state) => const PropertiesScreen()),
      GoRoute(path: '/host/properties/add', builder: (context, state) => const AddPropertyScreen()),
      GoRoute(path: '/host/properties/:id', builder: (context, state) => const Placeholder()), // TODO: Add PropertyDetail
      GoRoute(path: '/host/booking/new', builder: (context, state) => RequestCleaningScreen(propertyId: state.uri.queryParameters['propertyId'])),
      GoRoute(path: '/host/booking/:id', builder: (context, state) => BookingDetailScreen(bookingId: state.pathParameters['id']!)),
      GoRoute(path: '/host/booking/:id/photos', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/host/bookings', builder: (context, state) => const BookingsListScreen()),
      GoRoute(path: '/host/profile', builder: (context, state) => const HostProfileScreen()),

      // Cleaner Routes
      GoRoute(path: '/cleaner/home', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/jobs/available', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/jobs/:id', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/jobs/active', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/earnings', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/profile', builder: (context, state) => const Placeholder()),
      GoRoute(path: '/cleaner/onboarding/stripe', builder: (context, state) => const Placeholder()),
    ],
  );
}

/// Helper class to trigger router refresh when auth state changes
class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(WidgetRef ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider((ref) => AppRouter(ref).router);
