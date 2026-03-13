import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/clean_card.dart';
import '../../../core/widgets/empty_state.dart';

class PropertiesScreen extends ConsumerWidget {
  const PropertiesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Assuming a propertyProvider exists or using state directly
    final propertiesAsync = AsyncValue.data([]); // Placeholder for actual provider

    return Scaffold(
      appBar: AppBar(
        title: Text('My Properties', style: AppTypography.heading2),
        elevation: 0,
      ),
      body: propertiesAsync.when(
        data: (properties) {
          if (properties.isEmpty) {
            return EmptyState(
              icon: Icons.business_outlined,
              title: 'No Properties Yet',
              subtitle: 'Add your first property to start booking cleanings.',
              buttonText: 'Add Property',
              onButtonPressed: () => context.push('/host/properties/add'),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: properties.length,
            itemBuilder: (context, index) {
              final prop = properties[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16.0),
                child: CleanCard(
                  onTap: () => context.push('/host/properties/${prop.id}'),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.home_work_outlined, color: AppColors.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(prop.name, style: AppTypography.heading2.copyWith(fontSize: 16)),
                            const SizedBox(height: 4),
                            Text('${prop.numBedrooms} Bed • ${prop.numBathrooms} Bath • ${prop.propertyType}', style: AppTypography.caption),
                            const SizedBox(height: 2),
                            Text(prop.addressLine1, style: AppTypography.caption),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error loading properties')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/host/properties/add'),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
