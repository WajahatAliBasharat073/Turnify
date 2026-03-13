import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

enum BookingStatusValue {
  pendingPayment,
  searching,
  assigned,
  inProgress,
  completed,
  cancelled,
}

class StatusBadge extends StatelessWidget {
  final String statusString;
  
  const StatusBadge({Key? key, required this.statusString}) : super(key: key);

  BookingStatusValue _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending_payment': return BookingStatusValue.pendingPayment;
      case 'searching': return BookingStatusValue.searching;
      case 'assigned': return BookingStatusValue.assigned;
      case 'in_progress': return BookingStatusValue.inProgress;
      case 'completed': return BookingStatusValue.completed;
      case 'cancelled': return BookingStatusValue.cancelled;
      default: return BookingStatusValue.searching;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _parseStatus(statusString);
    
    Color backgroundColor;
    Color textColor;
    String label;

    switch (status) {
      case BookingStatusValue.pendingPayment:
        backgroundColor = AppColors.warning.withOpacity(0.15);
        textColor = AppColors.warning;
        label = 'Pending Payment';
        break;
      case BookingStatusValue.searching:
        backgroundColor = AppColors.primaryLight.withOpacity(0.15);
        textColor = AppColors.primaryLight;
        label = 'Searching';
        break;
      case BookingStatusValue.assigned:
        backgroundColor = AppColors.primary.withOpacity(0.15);
        textColor = AppColors.primary;
        label = 'Assigned';
        break;
      case BookingStatusValue.inProgress:
        backgroundColor = AppColors.hostAccent.withOpacity(0.15);
        textColor = AppColors.hostAccent;
        label = 'In Progress';
        break;
      case BookingStatusValue.completed:
        backgroundColor = AppColors.success.withOpacity(0.15);
        textColor = AppColors.success;
        label = 'Completed';
        break;
      case BookingStatusValue.cancelled:
        backgroundColor = AppColors.error.withOpacity(0.15);
        textColor = AppColors.error;
        label = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
