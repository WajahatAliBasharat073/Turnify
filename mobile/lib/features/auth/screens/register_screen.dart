import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/widgets/clean_button.dart';
import '../../../core/widgets/clean_text_field.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  final String initialRole;

  const RegisterScreen({Key? key, this.initialRole = 'host'}) : super(key: key);

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  late String _selectedRole;
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isLoading = false;
  bool _agreedToTerms = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate() || !_agreedToTerms) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.post('/auth/register', data: {
        'role': _selectedRole,
        'first_name': _firstNameController.text,
        'last_name': _lastNameController.text,
        'email': _emailController.text,
        'phone': _phoneController.text,
        'password': _passwordController.text,
      });

      if (mounted) {
        if (_selectedRole == 'cleaner') {
          _showSuccessDialog('Cleaner Application Submitted', 
            'Your account will be reviewed within 24 hours. You will be notified once approved.');
        } else {
          // Auto login or redirect to login
          context.go('/login');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Registration successful! Please login.')),
          );
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(title, style: AppTypography.heading1),
        content: Text(message, style: AppTypography.body),
        actions: [
          TextButton(
            onPressed: () {
              context.pop(); // Close dialog
              context.go('/login');
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  double _calculatePasswordStrength() {
    if (_passwordController.text.isEmpty) return 0;
    double strength = 0;
    if (_passwordController.text.length >= 8) strength += 0.25;
    if (_passwordController.text.contains(RegExp(r'[A-Z]'))) strength += 0.25;
    if (_passwordController.text.contains(RegExp(r'[0-9]'))) strength += 0.25;
    if (_passwordController.text.contains(RegExp(r'[!@#\$&*~]'))) strength += 0.25;
    return strength;
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = _selectedRole == 'host' ? AppColors.hostAccent : AppColors.cleanerAccent;

    return Scaffold(
      appBar: AppBar(
        title: Text('Create Account', style: AppTypography.heading2),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Role Selector
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _RoleTab(
                          label: 'Host',
                          isSelected: _selectedRole == 'host',
                          color: AppColors.hostAccent,
                          onTap: () => setState(() => _selectedRole = 'host'),
                        ),
                      ),
                      Expanded(
                        child: _RoleTab(
                          label: 'Cleaner',
                          isSelected: _selectedRole == 'cleaner',
                          color: AppColors.cleanerAccent,
                          onTap: () => setState(() => _selectedRole = 'cleaner'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Text(_errorMessage!, style: AppTypography.bodySmall.copyWith(color: AppColors.error)),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: CleanTextField(
                        label: 'First Name',
                        controller: _firstNameController,
                        hint: 'John',
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: CleanTextField(
                        label: 'Last Name',
                        controller: _lastNameController,
                        hint: 'Doe',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                CleanTextField(
                  label: 'Email Address',
                  controller: _emailController,
                  hint: 'john@example.com',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                ),
                const SizedBox(height: 24),
                CleanTextField(
                  label: 'Phone Number',
                  controller: _phoneController,
                  hint: '+1 234 567 8900',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                ),
                const SizedBox(height: 24),
                CleanTextField(
                  label: 'Password',
                  controller: _passwordController,
                  isPassword: true,
                  prefixIcon: Icons.lock_outline,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 8),
                // Password Strength
                LinearProgressIndicator(
                  value: _calculatePasswordStrength(),
                  backgroundColor: AppColors.border,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _calculatePasswordStrength() < 0.5 
                      ? AppColors.error 
                      : _calculatePasswordStrength() < 0.75 
                        ? AppColors.warning 
                        : AppColors.success,
                  ),
                  minHeight: 4,
                ),
                const SizedBox(height: 24),
                CleanTextField(
                  label: 'Confirm Password',
                  controller: _confirmPasswordController,
                  isPassword: true,
                  prefixIcon: Icons.lock_reset_outlined,
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Checkbox(
                      value: _agreedToTerms,
                      activeColor: themeColor,
                      onChanged: (val) => setState(() => _agreedToTerms = val ?? false),
                    ),
                    Expanded(
                      child: Text(
                        'I agree to the Terms of Service and Privacy Policy',
                        style: AppTypography.caption,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                CleanButton(
                  text: _selectedRole == 'host' ? 'Create Host Account' : 'Apply as Cleaner',
                  onPressed: _agreedToTerms ? _handleRegister : null,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;

  const _RoleTab({
    required this.label,
    required this.isSelected,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(
            label,
            style: AppTypography.button.copyWith(
              color: isSelected ? Colors.white : AppColors.textSecondary,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
