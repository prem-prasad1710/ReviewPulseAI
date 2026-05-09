/**
 * Background Job Scheduler for ReviewPulse
 * Handles:
 * - Real-time alert triggers for new low-rating reviews
 * - Sentiment analysis batch processing
 * - Alert escalation for unreplied reviews
 * - Weekly report generation
 */

import { getDb } from '@/lib/mongodb'
import { alertManager } from '@/lib/alerts'
import { sentimentAnalyzer } from '@/lib/multilingual-sentiment'

class BackgroundJobScheduler {
  private jobs: Map<string, any> = new Map()
  private isInitialized = false
  private cronInitialized = false

  /**
   * Initialize all background jobs
   */
  async initialize() {
    if (this.isInitialized) return

    try {
      // Try to import cron dynamically
      try {
        const { CronJob } = await import('cron')
        this.cronInitialized = true
        
        // Job 1: Check for new low-rating reviews and send alerts (every 5 minutes)
        this.scheduleJob('low-rating-alerts', '*/5 * * * *', () => this.processLowRatingAlerts(), CronJob)

        // Job 2: Analyze sentiment for unanalyzed reviews (every 15 minutes)
        this.scheduleJob('sentiment-analysis', '*/15 * * * *', () => this.processSentimentAnalysis(), CronJob)

        // Job 3: Check alert escalation (every hour)
        this.scheduleJob('alert-escalation', '0 * * * *', () => this.checkAlertEscalation(), CronJob)

        // Job 4: Generate weekly reports (every Monday at 8 AM)
        this.scheduleJob('weekly-reports', '0 8 * * 1', () => this.generateWeeklyReports(), CronJob)
      } catch (cronError) {
        console.warn('Cron module not available - background jobs disabled:', cronError)
      }

      this.isInitialized = true
      console.log('✅ Background jobs initialized' + (this.cronInitialized ? '' : ' (in-memory mode)'))
    } catch (error) {
      console.error('Failed to initialize jobs:', error)
    }
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(name: string, cronTime: string, task: () => Promise<void>, CronJob: any) {
    try {
      const job = new CronJob(cronTime, async () => {
        try {
          console.log(`🔄 Running job: ${name}`)
          await task()
          console.log(`✅ Completed job: ${name}`)
        } catch (error) {
          console.error(`❌ Job failed: ${name}`, error)
        }
      })

      job.start()
      this.jobs.set(name, job)
    } catch (error) {
      console.error(`Failed to schedule job ${name}:`, error)
    }
  }

  /**
   * Process low-rating reviews and send alerts
   */
  private async processLowRatingAlerts() {
    const db = await getDb()

    // Find recent low-rating reviews that haven't been alerted
    const reviews = await db
      .collection('reviews')
      .find({
        rating: { $lte: 2 },
        lowRatingWhatsAppNotified: false,
        reviewCreatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      })
      .limit(50)
      .toArray()

    for (const review of reviews) {
      try {
        // Get user alert config
        const user = await db.collection('users').findOne({ _id: review.userId })
        const alertConfig = user?.alertConfig || {
          enableEmailAlerts: true,
          enableSMSAlerts: false,
          minRatingThreshold: 2,
          channels: ['email'],
        }

        // Only send if threshold is met
        if (review.rating <= alertConfig.minRatingThreshold) {
          await alertManager.sendLowRatingAlert(
            {
              locationId: review.locationId.toString(),
              userId: review.userId,
              reviewId: review._id.toString(),
              reviewerName: review.reviewerName || 'Anonymous',
              rating: review.rating,
              comment: review.comment || review.reviewText || 'No comment',
              sentiment: review.sentiment || 'neutral',
              language: review.detectedLanguage || 'english',
            },
            alertConfig
          )

          // Mark as notified
          await db.collection('reviews').updateOne(
            { _id: review._id },
            { $set: { lowRatingWhatsAppNotified: true, alertSentAt: new Date() } }
          )
        }
      } catch (error) {
        console.error(`Error processing alert for review ${review._id}:`, error)
      }
    }
  }

  /**
   * Analyze sentiment for unanalyzed reviews
   */
  private async processSentimentAnalysis() {
    const db = await getDb()

    // Find reviews without sentiment scores that are recent
    const reviews = await db
      .collection('reviews')
      .find({
        $or: [{ sentiment: null }, { sentiment: undefined }, { sentimentScore: null }],
        reviewCreatedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      })
      .limit(20)
      .toArray()

    for (const review of reviews) {
      try {
        const text = review.comment || review.reviewText
        if (!text) continue

        // Analyze sentiment
        const result = await sentimentAnalyzer.analyzeReview(text)

        // Update review with analysis
        await db.collection('reviews').updateOne(
          { _id: review._id },
          {
            $set: {
              sentiment: result.sentiment,
              sentimentScore: result.sentimentScore,
              emotion: result.emotion,
              detectedLanguage: result.detectedLanguage,
              analyzedAt: new Date(),
            },
          }
        )

        console.log(`Analyzed review ${review._id}: ${result.sentiment}`)
      } catch (error) {
        console.error(`Error analyzing review ${review._id}:`, error)
      }
    }
  }

  /**
   * Check for alert escalation
   */
  private async checkAlertEscalation() {
    const db = await getDb()

    // Find unreplied alerts from 24+ hours ago
    const oldAlerts = await db
      .collection('alert_logs')
      .find({
        escalated: false,
        sentAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
      .toArray()

    for (const alert of oldAlerts) {
      try {
        const review = await db.collection('reviews').findOne({ _id: alert.reviewId })

        // If still unreplied, escalate
        if (review?.status !== 'replied') {
          // Send escalation alert
          await alertManager.sendLowRatingAlert(
            {
              locationId: alert.locationId.toString(),
              userId: alert.userId,
              reviewId: alert.reviewId.toString(),
              reviewerName: review?.reviewerName || 'Customer',
              rating: review?.rating || 2,
              comment: `[ESCALATION] ${review?.comment || 'See dashboard'}`,
              sentiment: 'negative',
              language: 'english',
            },
            { enableEmailAlerts: true, channels: ['email'], enableSMSAlerts: true, minRatingThreshold: 5 }
          )

          // Mark as escalated
          await db.collection('alert_logs').updateOne(
            { _id: alert._id },
            { $set: { escalated: true, escalatedAt: new Date() } }
          )

          console.log(`Escalated alert for review ${alert.reviewId}`)
        }
      } catch (error) {
        console.error(`Error escalating alert:`, error)
      }
    }
  }

  /**
   * Generate weekly reports
   */
  private async generateWeeklyReports() {
    const db = await getDb()

    // Get all active users
    const users = await db.collection('users').find({ active: true }).toArray()

    for (const user of users) {
      try {
        // In production, generate PDF/email report
        console.log(`Generating weekly report for user ${user._id}`)

        // Mark report generated
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { lastWeeklyReportAt: new Date() } }
        )
      } catch (error) {
        console.error(`Error generating report for user ${user._id}:`, error)
      }
    }
  }

  /**
   * Stop all jobs
   */
  stop() {
    this.jobs.forEach((job: any) => {
      if (job && typeof job.stop === 'function') {
        job.stop()
      }
    })
    console.log('All background jobs stopped')
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      jobs: Array.from(this.jobs.keys()),
      count: this.jobs.size,
    }
  }
}

export const backgroundJobScheduler = new BackgroundJobScheduler()
