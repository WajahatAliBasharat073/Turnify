import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CleanCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final bool hasBorder;

  const CleanCard({
    Key? key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16.0),
    this.hasBorder = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: hasBorder
            ? const BorderSide(color: AppColors.border)
            : BorderSide.none,
      ),
      elevation: hasBorder ? 0 : 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}
