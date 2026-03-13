class UserModel {
  final String id;
  final String email;
  final String role;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? avatarUrl;
  final String? onesignalPlayerId;

  UserModel({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.avatarUrl,
    this.onesignalPlayerId,
  });

  String get fullName => '$firstName $lastName';
  bool get isHost => role == 'host';
  bool get isCleaner => role == 'cleaner';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      role: json['role'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phone: json['phone'],
      avatarUrl: json['avatar_url'],
      onesignalPlayerId: json['onesignal_player_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'avatar_url': avatarUrl,
      'onesignal_player_id': onesignalPlayerId,
    };
  }
}
