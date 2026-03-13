import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { PricingService } from './pricing.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EstimateDto } from './dto/estimate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User, UserRole } from '../../database/entities/user.entity';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pricingService: PricingService,
  ) {}

  @Post('estimate')
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Get price estimate before booking' })
  @ApiResponse({ status: 200, description: 'Returns price breakdown' })
  async estimatePrice(@Body() estimateDto: EstimateDto) {
    return this.pricingService.calculate(
      estimateDto.property_id,
      estimateDto.booking_type,
    );
  }

  @Post()
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking successfully created' })
  create(@GetUser() user: User, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(user, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all bookings relevant to the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of bookings' })
  findAll(@GetUser() user: User) {
    return this.bookingsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  findOne(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(id, user); // Will throw Forbidden if user lacks access
  }

  @Patch(':id/cancel')
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Cancel a scheduled or pending booking' })
  cancel(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.cancel(id, user);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.HOST)
  @ApiOperation({ summary: 'Confirm job completed to trigger payout' })
  confirmCompletion(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.confirmCompletion(id, user);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get photos associated with a booking' })
  getPhotos(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    // Basic verification they have access to the booking first, then return photos
    // In a real app we would join photos on findOne or create a specific query
    return this.bookingsService.findOne(id, user).then((b) => b.photos || []);
  }

  @Patch(':id/accept')
  @Roles(UserRole.CLEANER)
  @ApiOperation({ summary: 'Accept a job offer' })
  acceptJob(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.acceptBooking(id, user);
  }

  @Patch(':id/decline')
  @Roles(UserRole.CLEANER)
  @ApiOperation({ summary: 'Decline a job offer' })
  declineJob(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.declineBooking(id, user);
  }

  @Patch(':id/start')
  @Roles(UserRole.CLEANER)
  @ApiOperation({ summary: 'Start a job (mark as in_progress)' })
  startJob(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.startBooking(id, user);
  }

  @Patch(':id/complete')
  @Roles(UserRole.CLEANER)
  @ApiOperation({ summary: 'Complete a job (requires after photos)' })
  completeJob(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.completeBooking(id, user);
  }
}
