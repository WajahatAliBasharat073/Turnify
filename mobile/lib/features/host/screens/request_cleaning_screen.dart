import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_button.dart';
import '../../../core/widgets/clean_card.dart';
import '../../../core/widgets/price_breakdown_card.dart';

class RequestCleaningScreen extends ConsumerStatefulWidget {
  final String? propertyId;
  const RequestCleaningScreen({Key? key, this.propertyId}) : super(key: key);

  @override
  ConsumerState<RequestCleaningScreen> createState() => _RequestCleaningScreenState();
}

class _RequestCleaningScreenState extends ConsumerState<RequestCleaningScreen> {
  String? _selectedPropertyId;
  bool _isInstant = true;
  DateTime _scheduledDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _scheduledTime = const TimeOfDay(hour: 10, minute: 0);
  final _instructionsController = TextEditingController();
  
  bool _isLoadingEstimate = false;
  Map<String, dynamic>? _estimate;

  @override
  void initState() {
    super.initState();
    _selectedPropertyId = widget.propertyId;
  }

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  Future<void> _getEstimate() async {
    if (_selectedPropertyId == null) return;
    
    setState(() => _isLoadingEstimate = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post('/bookings/estimate', data: {
        'property_id': _selectedPropertyId,
        'booking_type': _isInstant ? 'instant' : 'scheduled',
      });
      setState(() => _estimate = response);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoadingEstimate = false);
    }
  }

  void _showPaymentSheet() {
    if (_estimate == null) return;
    
    // Simulate payment sheet or call flutter_stripe
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _PaymentBottomSheet(
        estimate: _estimate!,
        onSuccess: () => context.go('/host/bookings'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Request Cleaning', style: AppTypography.heading2)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Property', style: AppTypography.heading2),
            const SizedBox(height: 12),
            _buildPropertySelector(),
            const SizedBox(height: 32),
            Text('Booking Type', style: AppTypography.heading2),
            const SizedBox(height: 12),
            _buildTypeToggle(),
            const SizedBox(height: 32),
            if (!_isInstant) ...[
              Text('Schedule Time', style: AppTypography.heading2),
              const SizedBox(height: 12),
              _buildDateTimePicker(),
              const SizedBox(height: 32),
            ],
            Text('Special Requests', style: AppTypography.heading2),
            const SizedBox(height: 12),
            TextField(
              controller: _instructionsController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Any special focus areas?',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 40),
            if (_estimate != null) ...[
              PriceBreakdownCard(
                subtotal: (_estimate!['price_subtotal'] as num).toDouble(),
                platformFee: (_estimate!['platform_fee'] as num).toDouble(),
                total: (_estimate!['price_total'] as num).toDouble(),
              ),
              const SizedBox(height: 24),
            ],
            CleanButton(
              text: _estimate == null ? 'Get Price Estimate' : 'Confirm & Pay',
              onPressed: _estimate == null ? _getEstimate : _showPaymentSheet,
              isLoading: _isLoadingEstimate,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPropertySelector() {
    return CleanCard(
      hasBorder: true,
      onTap: () {
        // Show property picker or navigate
      },
      child: Row(
        children: [
          const Icon(Icons.business, color: AppColors.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              _selectedPropertyId != null ? 'Modern Apartment (Selected)' : 'Tap to select property',
              style: AppTypography.body,
            ),
          ),
          const Icon(Icons.keyboard_arrow_down),
        ],
      ),
    );
  }

  Widget _buildTypeToggle() {
    return Row(
      children: [
        _buildToggleItem('Instant', 'Now', _isInstant, () => setState(() => _isInstant = true)),
        const SizedBox(width: 16),
        _buildToggleItem('Scheduled', 'Plan ahead', !_isInstant, () => setState(() => _isInstant = false)),
      ],
    );
  }

  Widget _buildToggleItem(String title, String sub, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: active ? AppColors.primary.withOpacity(0.05) : AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: active ? AppColors.primary : AppColors.border, width: 2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.heading2.copyWith(fontSize: 16, color: active ? AppColors.primary : AppColors.textPrimary)),
              Text(sub, style: AppTypography.caption),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDateTimePicker() {
    return CleanCard(
      hasBorder: true,
      onTap: () async {
        final date = await showDatePicker(
          context: context,
          initialDate: _scheduledDate,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 30)),
        );
        if (date != null) {
          final time = await showTimePicker(context: context, initialTime: _scheduledTime);
          if (time != null) {
            setState(() {
              _scheduledDate = date;
              _scheduledTime = time;
            });
          }
        }
      },
      child: Row(
        children: [
          const Icon(Icons.calendar_today, color: AppColors.primary),
          const SizedBox(width: 16),
          Text(
            '${_scheduledDate.day}/${_scheduledDate.month} at ${_scheduledTime.format(context)}',
            style: AppTypography.body,
          ),
        ],
      ),
    );
  }
}

class _PaymentBottomSheet extends StatelessWidget {
  final Map<String, dynamic> estimate;
  final VoidCallback onSuccess;

  const _PaymentBottomSheet({required this.estimate, required this.onSuccess});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      height: 400,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          const SizedBox(height: 24),
          Text('Confirm Payment', style: AppTypography.heading1),
          const SizedBox(height: 12),
          Text('You will be charged \$${(estimate['price_total'] as num).toStringAsFixed(2)}', style: AppTypography.body),
          const Spacer(),
          CleanButton(
            text: 'Pay Now',
            onPressed: () {
              // Simulate Stripe Success
              onSuccess();
            },
          ),
          const SizedBox(height: 12),
          const Center(child: Text('Secure payment powered by Stripe', style: AppTypography.caption)),
        ],
      ),
    );
  }
}
