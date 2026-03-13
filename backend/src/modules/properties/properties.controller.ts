import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'properties', version: '1' })
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property successfully created' })
  create(@GetUser() user: User, @Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(user.id, createPropertyDto);
  }

  @Get()
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'List all properties for the current host' })
  findAll(@GetUser() user: User) {
    return this.propertiesService.findAllByHost(user.id);
  }

  @Get(':id')
  @Roles(UserRole.HOST, UserRole.CLEANER)
  @ApiOperation({ summary: 'Get a specific property' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Note: The service currently strips access_instructions by default.
    // For cleaners to see access_instructions, we will fetch the property
    // exclusively through the BookingsService / Bookings endpoint when they
    // have an assigned booking.
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Update a specific property' })
  update(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user.id, id, updatePropertyDto);
  }

  @Delete(':id')
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Soft delete a property' })
  remove(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.remove(user.id, id);
  }
}
