import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { DispatchService } from './dispatch.service';

@Processor('dispatch')
export class DispatchProcessor {
  private readonly logger = new Logger(DispatchProcessor.name);

  constructor(private readonly dispatchService: DispatchService) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${err.message}`);
  }

  @Process('dispatch_job')
  async handleDispatchJob(job: Job<{ bookingId: string; round: number; excludedCleanerIds: string[] }>) {
    const { bookingId, round, excludedCleanerIds } = job.data;
    await this.dispatchService.dispatchJob(bookingId, round, excludedCleanerIds);
  }

  @Process('cleaner_timeout')
  async handleCleanerTimeout(job: Job<{ bookingId: string; round: number; offeredIds: string[]; combinedExcluded: string[] }>) {
    const { bookingId, round, offeredIds, combinedExcluded } = job.data;
    await this.dispatchService.handleCleanerTimeout(bookingId, round, offeredIds, combinedExcluded);
  }

  @Process('release_payout')
  async handleReleasePayout(job: Job<{ bookingId: string }>) {
    const { bookingId } = job.data;
    this.logger.log(`Releasing payout automatically for booking ${bookingId}`);
    
    // In actual stripe integration, invoke transfer logic
    // const booking = await this.bookingsRepository.findOne(bookingId)
    // await this.stripeService.transferToConnectAccount(booking.cleaner_id, booking.cleaner_payout);
  }
}
