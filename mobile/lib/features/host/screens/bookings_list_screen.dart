import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_card.dart';
import '../../../core/widgets/status_badge.dart';

class BookingsListScreen extends ConsumerStatefulWidget {
  const BookingsListScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends ConsumerState<BookingsListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Bookings', style: AppTypography.heading2),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Past'),
          ],
        ),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          final active = bookings.where((b) => b.status != 'completed' && b.status != 'cancelled').toList();
          final past = bookings.where((b) => b.status == 'completed' || b.status == 'cancelled').toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildBookingsList(active),
              _buildBookingsList(past),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error loading bookings')),
      ),
    );
  }

  Widget _buildBookingsList(List<dynamic> bookings) {
    if (bookings.isEmpty) {
      return Center(
        child: Text('No bookings found', style: AppTypography.bodySmall),
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.read(bookingsProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          final b = bookings[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: CleanCard(
              onTap: () => context.push('/host/booking/${b.id}'),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '12 June at 10:00 AM', // TODO: Format Date
                        style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold),
                      ),
                      StatusBadge(statusString: b.status),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12.0),
                    child: Divider(color: AppColors.border),
                  ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(4)),
                        child: const Icon(Icons.business, size: 20, color: AppColors.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          b.property?.name ?? 'Property',
                          style: AppTypography.body,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text('\$${(b.priceTotal as num).toStringAsFixed(0)}', style: AppTypography.heading2.copyWith(fontSize: 16)),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
