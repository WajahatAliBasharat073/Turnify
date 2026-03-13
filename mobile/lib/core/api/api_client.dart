import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'api_exception.dart';
import 'secure_storage.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorage _storage;

  ApiClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          final refreshToken = await _storage.getRefreshToken();
          if (refreshToken != null) {
            try {
              // Attempt to refresh token
              final refreshResponse = await Dio().post(
                '${_dio.options.baseUrl}/auth/refresh',
                data: {'refresh_token': refreshToken},
              );

              if (refreshResponse.statusCode == 200 || refreshResponse.statusCode == 201) {
                final data = refreshResponse.data['data'];
                final newAccessToken = data['access_token'];
                final newRefreshToken = data['refresh_token'];

                await _storage.saveTokens(newAccessToken, newRefreshToken);

                // Retry original request
                e.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                final cloneReq = await _dio.fetch(e.requestOptions);
                return handler.resolve(cloneReq);
              }
            } catch (error) {
              // Refresh failed, logout
              await _storage.clearAll();
              // In a real app, we would trigger a navigation to login here via a provider or event bus
            }
          } else {
            // No refresh token, logout
            await _storage.clearAll();
          }
        }

        // Parse standard error format
        final message = e.response?.data?['message'] ?? e.message ?? 'An unknown error occurred';
        final errors = e.response?.data?['errors'];
        
        return handler.next(DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: ApiException(
            statusCode: e.response?.statusCode,
            message: message,
            errors: errors is Map<String, dynamic> ? errors : null,
          ),
        ));
      },
    ));

    // Optional: Log requests/responses in debug mode
    // if (kDebugMode) {
    //   _dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
    // }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw e.error as ApiException;
    }
  }

  Future<dynamic> post(String path, {dynamic data}) async {
    try {
      final response = await _dio.post(path, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw e.error as ApiException;
    }
  }

  Future<dynamic> patch(String path, {dynamic data}) async {
    try {
      final response = await _dio.patch(path, data: data);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw e.error as ApiException;
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final response = await _dio.delete(path);
      return _handleResponse(response);
    } on DioException catch (e) {
      throw e.error as ApiException;
    }
  }

  dynamic _handleResponse(Response response) {
    final success = response.data['success'] ?? true;
    if (success) {
      return response.data['data'];
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: response.data['message'] ?? 'An error occurred',
        errors: response.data['errors'],
      );
    }
  }
}
