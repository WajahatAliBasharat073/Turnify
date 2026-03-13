class PropertyModel {
  final String id;
  final String hostId;
  final String name;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String zipCode;
  final double latitude;
  final double longitude;
  final String propertyType;
  final int sizeSqft;
  final int numBedrooms;
  final int numBathrooms;
  final String? specialInstructions;
  final String? accessInstructions;

  PropertyModel({
    required this.id,
    required this.hostId,
    required this.name,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.zipCode,
    required this.latitude,
    required this.longitude,
    required this.propertyType,
    required this.sizeSqft,
    required this.numBedrooms,
    required this.numBathrooms,
    this.specialInstructions,
    this.accessInstructions,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    return PropertyModel(
      id: json['id'],
      hostId: json['host_id'],
      name: json['name'],
      addressLine1: json['address_line1'],
      addressLine2: json['address_line2'],
      city: json['city'],
      state: json['state'],
      zipCode: json['zip_code'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      propertyType: json['property_type'],
      sizeSqft: json['size_sqft'],
      numBedrooms: json['num_bedrooms'],
      numBathrooms: json['num_bathrooms'],
      specialInstructions: json['special_instructions'],
      accessInstructions: json['access_instructions'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'host_id': hostId,
      'name': name,
      'address_line1': addressLine1,
      'address_line2': addressLine2,
      'city': city,
      'state': state,
      'zip_code': zipCode,
      'latitude': latitude,
      'longitude': longitude,
      'property_type': propertyType,
      'size_sqft': sizeSqft,
      'num_bedrooms': numBedrooms,
      'num_bathrooms': numBathrooms,
      'special_instructions': specialInstructions,
      'access_instructions': accessInstructions,
    };
  }
}
