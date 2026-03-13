import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/secure_storage.dart';
import '../models/user_model.dart';
import '../models/booking_model.dart';

// 1. Dependency injection providers
final secureStorageProvider = Provider((ref) => SecureStorage());

final apiClientProvider = Provider((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage);
});

// 2. Auth State Layer
enum AuthStatus { loggedOut, loading, authenticated }

class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;

  AuthState({required this.status, this.user, this.error});

  AuthState.initial() : status = AuthStatus.loggedOut, user = null, error = null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  final SecureStorage _storage;

  AuthNotifier(this._api, this._storage) : super(AuthState.initial()) {
    _init();
  }

  Future<void> _init() async {
    state = AuthState(status: AuthStatus.loading);
    final user = await _storage.getUser();
    if (user != null) {
      state = AuthState(status: AuthStatus.authenticated, user: user);
    } else {
      state = AuthState(status: AuthStatus.loggedOut);
    }
  }

  Future<void> login(String email, String password) async {
    state = AuthState(status: AuthStatus.loading);
    try {
      final response = await _api.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final user = UserModel.fromJson(response['user']);
      final accessToken = response['access_token'];
      final refreshToken = response['refresh_token'];

      await _storage.saveTokens(accessToken, refreshToken);
      await _storage.saveUser(user);

      state = AuthState(status: AuthStatus.authenticated, user: user);
    } catch (e) {
      state = AuthState(status: AuthStatus.loggedOut, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    state = AuthState(status: AuthStatus.loggedOut);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
});

final userProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

// 3. Bookings Layer
class BookingsNotifier extends AsyncNotifier<List<BookingModel>> {
  @override
  Future<List<BookingModel>> build() async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get('/bookings');
    return (response as List).map((e) => BookingModel.fromJson(e)).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => build());
  }
}

final bookingsProvider = AsyncNotifierProvider<BookingsNotifier, List<BookingModel>>(BookingsNotifier.new);

// 4. Notifications Layer
class NotificationsNotifier extends AsyncNotifier<List<dynamic>> {
  @override
  Future<List<dynamic>> build() async {
    final api = ref.watch(apiClientProvider);
    final response = await api.get('/notifications');
    return response['data'] ?? [];
  }
}

final notificationsProvider = AsyncNotifierProvider<NotificationsNotifier, List<dynamic>>(NotificationsNotifier.new);
