import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'clean_card.dart';

class PriceBreakdownCard extends StatelessWidget {
  final double subtotal;
  final double platformFee;
  final double total;
  final String currencySymbol;

  const PriceBreakdownCard({
    Key? key,
    required this.subtotal,
    required this.platformFee,
    required this.total,
    this.currencySymbol = '$',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CleanCard(
      hasBorder: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Price Breakdown', style: AppTypography.heading2),
          const SizedBox(height: 16),
          _buildRow('Subtotal', '$currencySymbol${subtotal.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _buildRow('Platform Fee', '$currencySymbol${platformFee.toStringAsFixed(2)}'),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12.0),
            child: Divider(color: AppColors.border),
          ),
          _buildRow(
            'Total',
            '$currencySymbol${total.toStringAsFixed(2)}',
            isTotal: true,
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppTypography.body.copyWith(fontWeight: FontWeight.bold) : AppTypography.body,
        ),
        Text(
          value,
          style: isTotal 
            ? AppTypography.heading2.copyWith(color: AppColors.primary) 
            : AppTypography.body.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
