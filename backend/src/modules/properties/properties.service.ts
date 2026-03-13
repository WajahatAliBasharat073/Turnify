import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../database/entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private propertiesRepository: Repository<Property>,
    private configService: ConfigService,
  ) {}

  /**
   * Masks sensitive information for list views
   */
  private maskSensitiveData(property: Property): Property {
    const masked = { ...property };
    delete masked.access_instructions;
    return masked;
  }

  /**
   * Geocodes an address using Google Maps API
   */
  private async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.warn('Google Maps API key not configured, skipping geocoding');
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      this.logger.warn(
        `Geocoding failed for address ${address}. Status: ${data.status}`,
      );
      return null;
    } catch (error) {
      this.logger.error(`Error during geocoding: ${error.message}`);
      return null;
    }
  }

  private buildAddressString(dto: CreatePropertyDto | UpdatePropertyDto): string {
    return `${dto.address_line1}, ${dto.city}, ${dto.state} ${dto.zip_code}, ${dto.country}`;
  }

  /**
   * Create a new property
   */
  async create(hostId: string, createPropertyDto: CreatePropertyDto): Promise<Property> {
    const property = this.propertiesRepository.create({
      ...createPropertyDto,
      host_id: hostId,
    });

    const fullAddress = this.buildAddressString(createPropertyDto);
    const coordinates = await this.geocodeAddress(fullAddress);

    if (coordinates) {
      property.latitude = coordinates.lat;
      property.longitude = coordinates.lng;
    }

    const savedProperty = await this.propertiesRepository.save(property);
    return this.maskSensitiveData(savedProperty);
  }

  /**
   * Find all properties for a specific host
   */
  async findAllByHost(hostId: string): Promise<Property[]> {
    const properties = await this.propertiesRepository.find({
      where: { host_id: hostId, is_active: true },
    });
    return properties.map((prop) => this.maskSensitiveData(prop));
  }

  /**
   * Find a single property by ID
   * Includes access instructions only if requested (and authorized upstream)
   */
  async findOne(id: string, includeAccessInstructions = false): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id, is_active: true },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return includeAccessInstructions ? property : this.maskSensitiveData(property);
  }

  /**
   * Update an existing property
   */
  async update(
    hostId: string,
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<Property> {
    const property = await this.findOne(id, true);

    if (property.host_id !== hostId) {
      throw new ForbiddenException('You do not have permission to update this property');
    }

    Object.assign(property, updatePropertyDto);

    // Re-geocode if address fields changed
    if (
      updatePropertyDto.address_line1 ||
      updatePropertyDto.city ||
      updatePropertyDto.state ||
      updatePropertyDto.zip_code
    ) {
      const fullAddress = this.buildAddressString({
        ...property,
        ...updatePropertyDto,
      } as CreatePropertyDto);
      const coordinates = await this.geocodeAddress(fullAddress);

      if (coordinates) {
        property.latitude = coordinates.lat;
        property.longitude = coordinates.lng;
      }
    }

    const updatedProperty = await this.propertiesRepository.save(property);
    return this.maskSensitiveData(updatedProperty);
  }

  /**
   * Soft delete a property
   */
  async remove(hostId: string, id: string): Promise<{ success: boolean }> {
    const property = await this.findOne(id);

    if (property.host_id !== hostId) {
      throw new ForbiddenException('You do not have permission to delete this property');
    }

    property.is_active = false;
    await this.propertiesRepository.save(property);
    return { success: true };
  }
}
