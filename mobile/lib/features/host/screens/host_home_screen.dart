import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_card.dart';
import '../../../core/widgets/status_badge.dart';

class HostHomeScreen extends ConsumerWidget {
  const HostHomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(bookingsProvider.notifier).refresh(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(user?.firstName ?? 'Host'),
                const SizedBox(height: 32),
                _buildSummaryCards(),
                const SizedBox(height: 32),
                _buildCTA(context),
                const SizedBox(height: 32),
                _buildRecentBookings(bookingsAsync),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(context, 0),
    );
  }

  Widget _buildHeader(String name) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Good morning,', style: AppTypography.bodySmall),
        Text(name, style: AppTypography.display),
      ],
    );
  }

  Widget _buildSummaryCards() {
    return Row(
      children: [
        Expanded(child: _SummaryCard(label: 'Active', value: '2', color: AppColors.primary)),
        const SizedBox(width: 12),
        Expanded(child: _SummaryCard(label: 'Done', value: '14', color: AppColors.success)),
        const SizedBox(width: 12),
        Expanded(child: _SummaryCard(label: 'Spent', value: '\$840', color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildCTA(BuildContext context) {
    return CleanCard(
      onTap: () => context.push('/host/booking/new'),
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add_task_rounded, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Request Cleaning', style: AppTypography.heading2),
                Text('Book a cleaner for your property', style: AppTypography.bodySmall),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
        ],
      ),
    );
  }

  Widget _buildRecentBookings(AsyncValue<List<dynamic>> bookingsAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Recent Bookings', style: AppTypography.heading2),
            TextButton(
              onPressed: () {},
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        bookingsAsync.when(
          data: (bookings) {
            if (bookings.isEmpty) {
              return Text('No bookings yet', style: AppTypography.bodySmall);
            }
            final recent = bookings.take(3).toList();
            return Column(
              children: recent.map((b) => _BookingListItem(booking: b)).toList(),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Text('Error loading bookings', style: AppTypography.bodySmall.copyWith(color: AppColors.error)),
        ),
      ],
    );
  }

  Widget _buildBottomNav(BuildContext context, int index) {
    return BottomNavigationBar(
      currentIndex: index,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textSecondary,
      onTap: (i) {
        if (i == 1) context.push('/host/properties');
        if (i == 2) context.push('/host/bookings');
        if (i == 3) context.push('/host/profile');
      },
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.business_outlined), activeIcon: Icon(Icons.business), label: 'Properties'),
        BottomNavigationBarItem(icon: Icon(Icons.calendar_today_outlined), activeIcon: Icon(Icons.calendar_today), label: 'Bookings'),
        BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return CleanCard(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
      child: Column(
        children: [
          Text(label, style: AppTypography.caption),
          const SizedBox(height: 4),
          Text(value, style: AppTypography.heading1.copyWith(color: color)),
        ],
      ),
    );
  }
}

class _BookingListItem extends StatelessWidget {
  final dynamic booking;
  const _BookingListItem({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: CleanCard(
        onTap: () => context.push('/host/booking/${booking.id}'),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking.property?.name ?? 'Property', style: AppTypography.heading2.copyWith(fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('Scheduled for June 12, 10:00 AM', style: AppTypography.caption),
                ],
              ),
            ),
            StatusBadge(statusString: booking.status),
          ],
        ),
      ),
    );
  }
}
