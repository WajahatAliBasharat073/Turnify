import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_button.dart';
import '../../../core/widgets/clean_card.dart';

class HostProfileScreen extends ConsumerWidget {
  const HostProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Profile', style: AppTypography.heading2)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildAvatar(user?.fullName ?? 'H'),
            const SizedBox(height: 16),
            Text(user?.fullName ?? 'Host Name', style: AppTypography.heading1),
            Text(user?.email ?? 'host@example.com', style: AppTypography.bodySmall),
            const SizedBox(height: 32),
            _buildProfileMenu(context, ref),
            const SizedBox(height: 40),
            CleanButton(
              text: 'Logout',
              onPressed: () => ref.read(authProvider.notifier).logout(),
              variant: CleanButtonVariant.destructive,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar(String name) {
    return Stack(
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: AppColors.primary.withOpacity(0.1),
          child: Text(
            name[0],
            style: AppTypography.display.copyWith(color: AppColors.primary, fontSize: 40),
          ),
        ),
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            child: const Icon(Icons.edit, color: Colors.white, size: 20),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileMenu(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        _buildMenuItem(Icons.person_outline, 'Personal Information', () {}),
        _buildMenuItem(Icons.payment_outlined, 'Payment Methods', () {}),
        _buildMenuItem(Icons.notifications_none_outlined, 'Notification Settings', () {}, trailing: Switch(value: true, onChanged: (v) {})),
        _buildMenuItem(Icons.help_outline, 'Help & Support', () {}),
        _buildMenuItem(Icons.policy_outlined, 'Privacy Policy', () {}),
      ],
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap, {Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: CleanCard(
        onTap: onTap,
        child: Row(
          children: [
            Icon(icon, color: AppColors.textSecondary),
            const SizedBox(width: 16),
            Expanded(child: Text(title, style: AppTypography.body)),
            trailing ?? const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}
