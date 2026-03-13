import 'user_model.dart';

class CleanerProfileModel {
  final String id;
  final String userId;
  final String? bio;
  final String? experience;
  final double averageRating;
  final int totalJobs;
  final bool isApproved;
  final bool isOnline;
  final String? stripeAccountId;

  CleanerProfileModel({
    required this.id,
    required this.userId,
    this.bio,
    this.experience,
    required this.averageRating,
    required this.totalJobs,
    required this.isApproved,
    required this.isOnline,
    this.stripeAccountId,
  });

  factory CleanerProfileModel.fromJson(Map<String, dynamic> json) {
    return CleanerProfileModel(
      id: json['id'],
      userId: json['user_id'],
      bio: json['bio'],
      experience: json['experience'],
      averageRating: (json['average_rating'] as num).toDouble(),
      totalJobs: json['total_jobs'] ?? 0,
      isApproved: json['is_approved'] ?? false,
      isOnline: json['is_online'] ?? false,
      stripeAccountId: json['stripe_account_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'bio': bio,
      'experience': experience,
      'average_rating': averageRating,
      'total_jobs': totalJobs,
      'is_approved': isApproved,
      'is_online': isOnline,
      'stripe_account_id': stripeAccountId,
    };
  }
}
