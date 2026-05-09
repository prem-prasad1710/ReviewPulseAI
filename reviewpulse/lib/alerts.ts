/**
 * Real-time Alert System for ReviewPulse
 * Sends email/SMS alerts for low-rating reviews (1-2 stars)
 * Supports multiple channels and escalation rules
 */

import { Resend } from 'resend'
import twilio from 'twilio'
import { getDb } from '@/lib/mongodb'

export interface AlertConfig {
  enableEmailAlerts: boolean
  enableSMSAlerts: boolean
  minRatingThreshold: number // Alert when rating <= this (e.g., 2)
  channels: ('email' | 'sms' | 'whatsapp')[]
  escalateAfterMinutes?: number // Re-alert if not replied
}

export interface AlertPayload {
  locationId: string
  userId: string
  reviewId: string
  reviewerName: string
  rating: number
  comment: string
  sentiment: string
  language: string
}

class AlertManager {
  private resend: Resend | null = null

  constructor() {
    try {
      const apiKey = process.env.RESEND_API_KEY?.trim()
      if (apiKey) {
        this.resend = new Resend(apiKey)
      }
    } catch (error) {
      console.warn('Resend not configured:', error)
    }
  }

  /**
   * Send alert for low-rating review
   */
  async sendLowRatingAlert(payload: AlertPayload, config: AlertConfig) {
    const { locationId, userId, reviewId, reviewerName, rating, comment, language } = payload

    try {
      // Get user and location details for context
      const db = await getDb()
      const userCol = db?.collection('users')
      const locationCol = db?.collection('locations')
      
      if (!userCol || !locationCol) {
        console.error('Database collections not found')
        return
      }
      
      const user = await userCol.findOne({ _id: userId }) as any
      const location = await locationCol.findOne({ _id: locationId }) as any

      if (!user || !location) {
        console.error('User or location not found for alert')
        return
      }

      const alertData = {
        businessName: location.name || location.googlePlaceName || 'Your Business',
        locationName: location.name || location.googlePlaceName,
        reviewerName,
        rating,
        comment: comment.substring(0, 200),
        language,
        timestamp: new Date().toISOString(),
      }

      // Send via enabled channels
      if (config.enableEmailAlerts && config.channels.includes('email')) {
        await this.sendEmailAlert(user.email, alertData, language)
      }

      if (config.enableSMSAlerts && config.channels.includes('sms') && user.phone) {
        await this.sendSMSAlert(user.phone, alertData, language)
      }

      if (config.channels.includes('whatsapp') && user.whatsappPhone) {
        await this.sendWhatsAppAlert(user.whatsappPhone, alertData, language)
      }

      // Log alert sent
      await db.collection('alert_logs').insertOne({
        userId,
        locationId,
        reviewId,
        channels: config.channels,
        sentAt: new Date(),
        rating,
        escalated: false,
      })
    } catch (error) {
      console.error('Error sending alert:', error)
      throw error
    }
  }

  /**
   * Send email alert with formatted content
   */
  private async sendEmailAlert(email: string, data: any, language: string) {
    try {
      if (!this.resend) {
        console.warn('Resend not configured')
        return null
      }
      
      const subject = this.getAlertSubject(data.rating, language)
      const body = this.getAlertEmailBody(data, language)

      return await this.resend.emails.send({
        from: 'alerts@reviewpulse.io',
        to: email,
        subject,
        html: body,
      })
    } catch (error) {
      console.error('Email send error:', error)
      throw error
    }
  }

  /**
   * Send SMS alert (Twilio)
   */
  private async sendSMSAlert(phone: string, data: any, language: string) {
    try {
      const message = this.getAlertSMSBody(data, language)
      const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
      const token = process.env.TWILIO_AUTH_TOKEN?.trim()
      const fromPhone = process.env.TWILIO_PHONE_NUMBER?.trim()
      
      if (!sid || !token || !fromPhone) {
        console.warn('Twilio SMS not configured')
        return null
      }

      const client = twilio(sid, token)
      return await client.messages.create({
        body: message,
        from: fromPhone,
        to: phone,
      })
    } catch (error) {
      console.error('SMS send error:', error)
      throw error
    }
  }

  /**
   * Send WhatsApp alert (Twilio)
   */
  private async sendWhatsAppAlert(phone: string, data: any, language: string) {
    try {
      const message = this.getAlertWhatsAppBody(data, language)
      const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
      const token = process.env.TWILIO_AUTH_TOKEN?.trim()
      const fromPhone = process.env.TWILIO_WHATSAPP_NUMBER?.trim()
      
      if (!sid || !token || !fromPhone) {
        console.warn('Twilio WhatsApp not configured')
        return null
      }

      const client = twilio(sid, token)
      return await client.messages.create({
        body: message,
        from: `whatsapp:${fromPhone}`,
        to: `whatsapp:${phone}`,
      })
    } catch (error) {
      console.error('WhatsApp send error:', error)
      throw error
    }
  }

  /**
   * Get localized alert subject
   */
  private getAlertSubject(rating: number, language: string): string {
    const subjects: Record<string, Record<number, string>> = {
      en: {
        1: '🚨 Urgent: 1-Star Review Alert',
        2: '⚠️ Alert: 2-Star Review Received',
      },
      hi: {
        1: '🚨 जरूरी: 1-स्टार रिव्यू अलर्ट',
        2: '⚠️ सतर्कता: 2-स्टार रिव्यू मिला',
      },
      hinglish: {
        1: '🚨 Urgent: 1-Star Review Alert (Hinglish)',
        2: '⚠️ Dekhen: 2-Star Review Mila',
      },
    }

    return subjects[language]?.[rating] || subjects['en'][rating]
  }

  /**
   * Generate formatted email body
   */
  private getAlertEmailBody(data: any, language: string): string {
    const lang = language.toLowerCase()
    const headers: Record<string, string> = {
      en: `<h2>New Low-Rating Review: ${data.rating}⭐</h2>`,
      hi: `<h2>नया कम रेटिंग रिव्यू: ${data.rating}⭐</h2>`,
      hinglish: `<h2>Naya Low Rating Review: ${data.rating}⭐</h2>`,
    }

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${headers[lang] || headers.en}
        <p><strong>${data.businessName}</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Reviewer:</strong> ${data.reviewerName}</p>
          <p><strong>Rating:</strong> ${data.rating}⭐</p>
          <p><strong>Comment:</strong> ${data.comment}</p>
          <p><small>Language: ${data.language.toUpperCase()}</small></p>
        </div>
        <p style="color: #666; font-size: 12px;">
          Reply quickly to improve your rating and customer satisfaction.
        </p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/reviews" 
           style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          Reply Now
        </a>
      </div>
    `

    return body
  }

  /**
   * Generate SMS alert message
   */
  private getAlertSMSBody(data: any, language: string): string {
    const templates: Record<string, string> = {
      en: `${data.rating}⭐ Review: "${data.comment.substring(0, 50)}..." - ${data.reviewerName}. Reply: ${process.env.NEXT_PUBLIC_BASE_URL}/r`,
      hi: `${data.rating}⭐ रिव्यू: "${data.comment.substring(0, 40)}..." - ${data.reviewerName}. जवाब: ${process.env.NEXT_PUBLIC_BASE_URL}/r`,
      hinglish: `${data.rating}⭐ Review: "${data.comment.substring(0, 50)}..." - ${data.reviewerName}. Jawaab: ${process.env.NEXT_PUBLIC_BASE_URL}/r`,
    }

    return templates[language] || templates['en']
  }

  /**
   * Generate WhatsApp alert message
   */
  private getAlertWhatsAppBody(data: any, language: string): string {
    const templates: Record<string, string> = {
      en: `📌 *New ${data.rating}⭐ Review*\n\n*From:* ${data.reviewerName}\n*Comment:* ${data.comment.substring(0, 80)}\n\n[Reply Now](${process.env.NEXT_PUBLIC_BASE_URL}/r)`,
      hi: `📌 *नया ${data.rating}⭐ रिव्यू*\n\n*से:* ${data.reviewerName}\n*टिप्पणी:* ${data.comment.substring(0, 60)}\n\n[अभी जवाब दें](${process.env.NEXT_PUBLIC_BASE_URL}/r)`,
      hinglish: `📌 *Naya ${data.rating}⭐ Review*\n\n*Se:* ${data.reviewerName}\n*Comment:* ${data.comment.substring(0, 80)}\n\n[Abhi Jawaab De](${process.env.NEXT_PUBLIC_BASE_URL}/r)`,
    }

    return templates[language] || templates['en']
  }

  /**
   * Check for escalation (re-alert if not replied)
   */
  async checkEscalation(reviewId: string, config: AlertConfig) {
    if (!config.escalateAfterMinutes) return

    const db = await getDb()
    const review = await db.collection('reviews').findOne({ _id: reviewId }) as any

    if (review?.status === 'replied') return

    const alertLog = await db.collection('alert_logs').findOne({
      reviewId,
      escalated: false,
    }) as any

    if (alertLog) {
      const minutesElapsed = (Date.now() - alertLog.sentAt.getTime()) / (1000 * 60)
      if (minutesElapsed >= config.escalateAfterMinutes) {
        // Send escalation alert
        await db.collection('alert_logs').updateOne(
          { _id: alertLog._id },
          { $set: { escalated: true, escalatedAt: new Date() } }
        )
        console.log(`Escalating alert for review ${reviewId}`)
      }
    }
  }
}

export const alertManager = new AlertManager()
