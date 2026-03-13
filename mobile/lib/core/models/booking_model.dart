import 'user_model.dart';
import 'property_model.dart';

class BookingModel {
  final String id;
  final String hostId;
  final String? cleanerId;
  final String propertyId;
  final String status;
  final DateTime scheduledAt;
  final double priceTotal;
  final double priceSubtotal;
  final double platformFee;
  final PropertyModel? property;
  final UserModel? host;
  final UserModel? cleaner;

  BookingModel({
    required this.id,
    required this.hostId,
    this.cleanerId,
    required this.propertyId,
    required this.status,
    required this.scheduledAt,
    required this.priceTotal,
    required this.priceSubtotal,
    required this.platformFee,
    this.property,
    this.host,
    this.cleaner,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      id: json['id'],
      hostId: json['host_id'],
      cleanerId: json['cleaner_id'],
      propertyId: json['property_id'],
      status: json['status'],
      scheduledAt: DateTime.parse(json['scheduled_at']),
      priceTotal: (json['price_total'] as num).toDouble(),
      priceSubtotal: (json['price_subtotal'] as num).toDouble(),
      platformFee: (json['platform_fee'] as num).toDouble(),
      property: json['property'] != null ? PropertyModel.fromJson(json['property']) : null,
      host: json['host'] != null ? UserModel.fromJson(json['host']) : null,
      cleaner: json['cleaner'] != null ? UserModel.fromJson(json['cleaner']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'host_id': hostId,
      'cleaner_id': cleanerId,
      'property_id': propertyId,
      'status': status,
      'scheduled_at': scheduledAt.toIso8601String(),
      'price_total': priceTotal,
      'price_subtotal': priceSubtotal,
      'platform_fee': platformFee,
      'property': property?.toJson(),
      'host': host?.toJson(),
      'cleaner': cleaner?.toJson(),
    };
  }
}
