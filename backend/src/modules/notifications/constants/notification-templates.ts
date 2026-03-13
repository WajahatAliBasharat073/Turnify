export const NOTIFICATION_TEMPLATES = {
  booking_confirmed: {
    title: 'Booking Confirmed 🎉',
    body: 'Your cleaning is scheduled for {date}',
  },
  job_available: {
    title: 'New Job Available! 🧹',
    body: '{property_type} in {city} — ${price}',
  },
  job_accepted: {
    title: 'Cleaner Assigned ✅',
    body: '{cleaner_name} will arrive at {time}',
  },
  job_declined: {
    title: 'Finding Another Cleaner 🔍',
    body: "We're searching for availability",
  },
  job_started: {
    title: 'Cleaning Started 🧹',
    body: '{cleaner_name} has started cleaning',
  },
  job_completed: {
    title: 'Cleaning Complete! ✨',
    body: 'Your property is ready. Please confirm.',
  },
  payment_received: {
    title: 'Payment Received 💰',
    body: '${amount} payment confirmed',
  },
  payout_sent: {
    title: 'Payout Sent 💸',
    body: '${amount} sent to your bank account',
  },
  approval_approved: {
    title: "You're Approved! 🎉",
    body: 'Start accepting cleaning jobs now',
  },
  approval_rejected: {
    title: 'Application Update',
    body: 'Please review our feedback and reapply',
  },
};
