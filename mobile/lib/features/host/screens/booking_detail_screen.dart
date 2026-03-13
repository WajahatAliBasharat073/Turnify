import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_card.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../core/widgets/booking_status_timeline.dart';

class BookingDetailScreen extends ConsumerStatefulWidget {
  final String bookingId;
  const BookingDetailScreen({Key? key, required this.bookingId}) : super(key: key);

  @override
  ConsumerState<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  // TODO: Add WebSocket listener for booking updates

  @override
  Widget build(BuildContext context) {
    // Mock booking data
    final booking = {
      'id': widget.bookingId,
      'status': 'searching',
      'scheduled_at': '2026-06-12T10:00:00Z',
      'price_total': 125.00,
      'property': {
        'name': 'Modern Apartment',
        'address_line1': '123 Main St, Apt 4B',
      },
      'cleaner': null, // Map if assigned
    };

    final int currentStep = _getStatusIndex(booking['status'] as String);
    final List<String> steps = ['Searching', 'Assigned', 'In Progress', 'Completed'];

    return Scaffold(
      appBar: AppBar(title: Text('Booking Details', style: AppTypography.heading2)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Status', style: AppTypography.heading2),
                StatusBadge(statusString: booking['status'] as String),
              ],
            ),
            const SizedBox(height: 24),
            BookingStatusTimeline(currentStep: currentStep, steps: steps),
            const SizedBox(height: 40),
            _buildSectionHeader('Property Details'),
            const SizedBox(height: 12),
            _buildPropertyCard(booking['property'] as Map),
            const SizedBox(height: 32),
            _buildSectionHeader('Cleaner'),
            const SizedBox(height: 12),
            _buildCleanerCard(booking['cleaner'] as Map?),
            const SizedBox(height: 32),
            _buildSectionHeader('Photos'),
            const SizedBox(height: 12),
            _buildPhotosPlaceholder(),
            const SizedBox(height: 40),
            if (booking['status'] == 'completed')
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () {},
                  child: const Text('Confirm Completion'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  int _getStatusIndex(String status) {
    switch (status) {
      case 'searching': return 0;
      case 'assigned': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: AppTypography.heading2.copyWith(fontSize: 16));
  }

  Widget _buildPropertyCard(Map property) {
    return CleanCard(
      hasBorder: true,
      child: Row(
        children: [
          const Icon(Icons.business_outlined, color: AppColors.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(property['name'], style: AppTypography.body.copyWith(fontWeight: FontWeight.bold)),
                Text(property['address_line1'], style: AppTypography.caption),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCleanerCard(Map? cleaner) {
    if (cleaner == null) {
      return CleanCard(
        hasBorder: true,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Row(
            children: [
              const Icon(Icons.person_search_outlined, color: AppColors.textSecondary),
              const SizedBox(width: 16),
              Text('Finding a cleaner for you...', style: AppTypography.bodySmall),
            ],
          ),
        ),
      );
    }
    return CleanCard(
      hasBorder: true,
      child: Row(
        children: [
          const CircleAvatar(backgroundColor: AppColors.border, child: Icon(Icons.person)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cleaner['name'], style: AppTypography.body.copyWith(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 14),
                    const SizedBox(width: 4),
                    Text(cleaner['rating'].toString(), style: AppTypography.caption),
                  ],
                ),
              ],
            ),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.chat_bubble_outline, color: AppColors.primary)),
        ],
      ),
    );
  }

  Widget _buildPhotosPlaceholder() {
    return Container(
      height: 120,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Text('Before/After photos will appear here', style: AppTypography.caption),
      ),
    );
  }
}
