import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_button.dart';
import '../../../core/widgets/clean_text_field.dart';

class AddPropertyScreen extends ConsumerStatefulWidget {
  const AddPropertyScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends ConsumerState<AddPropertyScreen> {
  int _currentStep = 0;
  bool _isLoading = false;

  // Step 1 Controllers
  final _nameController = TextEditingController();
  final _addressController = TextEditingController(); // TODO: Google Places
  String _propertyType = 'apartment';

  // Step 2 Controllers
  double _sizeSqft = 800;
  int _bedrooms = 1;
  int _bathrooms = 1;

  // Step 3 Controllers
  final _specialInstructionsController = TextEditingController();
  final _accessInstructionsController = TextEditingController();

  final List<String> _propertyTypes = [
    'apartment',
    'studio',
    'condo',
    'house',
    'villa',
    'other'
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _specialInstructionsController.dispose();
    _accessInstructionsController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 2) {
      setState(() => _currentStep++);
    } else {
      _saveProperty();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      context.pop();
    }
  }

  Future<void> _saveProperty() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/properties', data: {
        'name': _nameController.text,
        'address_line1': _addressController.text, // Simplified for now
        'city': 'New York', // Mocked until autocomplete integration
        'state': 'NY',
        'zip_code': '10001',
        'country': 'USA',
        'property_type': _propertyType,
        'size_sqft': _sizeSqft.toInt(),
        'num_bedrooms': _bedrooms,
        'num_bathrooms': _bathrooms,
        'special_instructions': _specialInstructionsController.text,
        'access_instructions': _accessInstructionsController.text,
      });

      if (mounted) {
        context.go('/host/properties');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Property added successfully!')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Add Property', style: AppTypography.heading2),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          _buildProgressBar(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: _buildStepContent(),
            ),
          ),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(3, (index) {
          final isActive = index <= _currentStep;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
              height: 4,
              decoration: BoxDecoration(
                color: isActive ? AppColors.primary : AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildStep1();
      case 1:
        return _buildStep2();
      case 2:
        return _buildStep3();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Basic Info', style: AppTypography.heading1),
        const SizedBox(height: 8),
        Text('Tell us about the property location and type.', style: AppTypography.bodySmall),
        const SizedBox(height: 32),
        CleanTextField(
          label: 'Property Name',
          hint: 'e.g. My Beach House',
          controller: _nameController,
        ),
        const SizedBox(height: 24),
        Text('Property Type', style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _propertyType,
          items: _propertyTypes.map((type) => DropdownMenuItem(
            value: type,
            child: Text(type[0].toUpperCase() + type.substring(1)),
          )).toList(),
          onChanged: (val) => setState(() => _propertyType = val!),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        const SizedBox(height: 24),
        CleanTextField(
          label: 'Address',
          hint: 'Start typing address...',
          controller: _addressController,
          prefixIcon: Icons.location_on_outlined,
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Details & Size', style: AppTypography.heading1),
        const SizedBox(height: 8),
        Text('Help us estimate the cleaning duration.', style: AppTypography.bodySmall),
        const SizedBox(height: 32),
        Text('Size: ${_sizeSqft.toInt()} sqft', style: AppTypography.body.copyWith(fontWeight: FontWeight.bold)),
        Slider(
          value: _sizeSqft,
          min: 100,
          max: 5000,
          divisions: 49,
          activeColor: AppColors.primary,
          onChanged: (val) => setState(() => _sizeSqft = val),
        ),
        const SizedBox(height: 32),
        _buildStepper('Bedrooms', _bedrooms, (val) => setState(() => _bedrooms = val)),
        const SizedBox(height: 24),
        _buildStepper('Bathrooms', _bathrooms, (val) => setState(() => _bathrooms = val)),
      ],
    );
  }

  Widget _buildStepper(String label, int value, Function(int) onChanged) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.body.copyWith(fontWeight: FontWeight.bold)),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.remove_circle_outline),
              onPressed: value > 1 ? () => onChanged(value - 1) : null,
            ),
            Text(value.toString(), style: AppTypography.heading2),
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => onChanged(value + 1),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Instructions', style: AppTypography.heading1),
        const SizedBox(height: 8),
        Text('Specific details for the cleaning professional.', style: AppTypography.bodySmall),
        const SizedBox(height: 32),
        CleanTextField(
          label: 'Special Instructions',
          hint: 'e.g. Please don\'t clean the master bedroom closet.',
          controller: _specialInstructionsController,
        ),
        const SizedBox(height: 24),
        CleanTextField(
          label: 'Access Instructions',
          hint: 'e.g. Lockbox code is 1234. Door is around back.',
          controller: _accessInstructionsController,
        ),
        const SizedBox(height: 8),
        Text('Note: Access instructions are only shared once a cleaner is assigned.', style: AppTypography.caption),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: _prevStep,
              child: Text(_currentStep == 0 ? 'Cancel' : 'Back'),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: CleanButton(
              text: _currentStep == 2 ? 'Save Property' : 'Next',
              onPressed: _nextStep,
              isLoading: _isLoading,
            ),
          ),
        ],
      ),
    );
  }
}
