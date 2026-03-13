import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class BookingStatusTimeline extends StatelessWidget {
  final int currentStep;
  final List<String> steps;
  final bool isVertical;

  const BookingStatusTimeline({
    Key? key,
    required this.currentStep,
    required this.steps,
    this.isVertical = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isVertical) {
      return Column(
        children: List.generate(steps.length, (index) => _buildVerticalStep(index)),
      );
    }
    return Row(
      children: List.generate(steps.length, (index) => Expanded(child: _buildHorizontalStep(index))),
    );
  }

  Widget _buildHorizontalStep(int index) {
    final bool isCompleted = index < currentStep;
    final bool isCurrent = index == currentStep;
    final Color color = (isCompleted || isCurrent) ? AppColors.primary : AppColors.border;

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Container(height: 2, color: index == 0 ? Colors.transparent : color)),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isCurrent ? AppColors.surface : color,
                shape: BoxShape.circle,
                border: isCurrent ? Border.all(color: AppColors.primary, width: 2) : null,
              ),
            ),
            Expanded(child: Container(height: 2, color: index == steps.length - 1 ? Colors.transparent : (index < currentStep ? color : AppColors.border))),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          steps[index],
          style: AppTypography.caption.copyWith(
            color: isCurrent ? AppColors.primary : AppColors.textSecondary,
            fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildVerticalStep(int index) {
    final bool isCompleted = index < currentStep;
    final bool isCurrent = index == currentStep;
    final Color color = (isCompleted || isCurrent) ? AppColors.primary : AppColors.border;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: isCurrent ? AppColors.surface : color,
                  shape: BoxShape.circle,
                  border: isCurrent ? Border.all(color: AppColors.primary, width: 2) : null,
                ),
              ),
              if (index < steps.length - 1)
                Expanded(
                  child: Container(
                    width: 2,
                    color: index < currentStep ? color : AppColors.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: Text(
              steps[index],
              style: AppTypography.body.copyWith(
                color: isCurrent ? AppColors.primary : AppColors.textSecondary,
                fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
