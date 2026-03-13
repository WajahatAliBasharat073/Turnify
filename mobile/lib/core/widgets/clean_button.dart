import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

enum CleanButtonVariant { primary, secondary, destructive }

class CleanButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final CleanButtonVariant variant;
  final IconData? icon;

  const CleanButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.variant = CleanButtonVariant.primary,
    this.icon,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color foregroundColor = AppColors.surface;
    Color borderColor = Colors.transparent;

    switch (variant) {
      case CleanButtonVariant.primary:
        backgroundColor = Theme.of(context).primaryColor;
        break;
      case CleanButtonVariant.secondary:
        backgroundColor = Colors.transparent;
        foregroundColor = Theme.of(context).primaryColor;
        borderColor = Theme.of(context).primaryColor;
        break;
      case CleanButtonVariant.destructive:
        backgroundColor = AppColors.error;
        break;
    }

    if (onPressed == null && !isLoading) {
      backgroundColor = AppColors.border;
      foregroundColor = AppColors.textSecondary;
      borderColor = Colors.transparent;
    }

    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: borderColor, width: 2),
          ),
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20),
                    const SizedBox(width: 8),
                  ],
                  Text(text, style: AppTypography.button.copyWith(color: foregroundColor)),
                ],
              ),
      ),
    );
  }
}
