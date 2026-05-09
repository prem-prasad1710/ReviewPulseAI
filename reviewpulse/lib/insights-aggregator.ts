/**
 * AI Insights Dashboard Data Aggregator
 * Generates trends, summaries, and actionable insights for ReviewPulse dashboard
 */

import { getDb } from '@/lib/mongodb'
import { sentimentAnalyzer } from '@/lib/multilingual-sentiment'
import { ObjectId } from 'mongodb'

export interface InsightsDashboardData {
  period: {
    startDate: Date
    endDate: Date
    totalDays: number
  }
  overview: {
    totalReviews: number
    averageRating: number
    responseRate: number // percentage of reviews replied
    avgResponseTime: number // minutes
  }
  sentiment: {
    positive: number
    neutral: number
    negative: number
    trend: 'improving' | 'declining' | 'stable'
    changePercent: number
  }
  emotions: {
    joy: number
    frustration: number
    gratitude: number
    disappointment: number
    anger: number
    surprise: number
    neutral: number
  }
  ratings: {
    distribution: Record<number, number> // 1-5 star count
    averageByDay: Array<{ date: string; avg: number }>
    recoveredReviews: number // reviews that improved after reply
  }
  topIssues: Array<{
    issue: string
    frequency: number
    severity: 'low' | 'medium' | 'high'
    relatedReviews: number
  }>
  topPraise: Array<{
    praise: string
    frequency: number
    impact: 'low' | 'medium' | 'high'
    relatedReviews: number
  }>
  alerts: {
    totalLowRatingAlerts: number
    unrepliedLowRatings: number
    averageTimeToFirstReply: number
  }
  performance: {
    bestDay: { date: string; reviews: number; avgRating: number }
    worstDay: { date: string; reviews: number; avgRating: number }
    locations: Array<{
      locationId: string
      locationName: string
      totalReviews: number
      avgRating: number
      sentiment: { positive: number; neutral: number; negative: number }
    }>
  }
  recommendations: Array<{
    type: 'priority' | 'improvement' | 'opportunity'
    title: string
    description: string
    impact: number // 0-1
    actionUrl?: string
  }>
  language_distribution: Record<string, number> // en, hi, hinglish, etc.
}

class InsightsAggregator {
  /**
   * Generate comprehensive dashboard insights for a location or user
   */
  async generateDashboardInsights(
    userId: string,
    locationId?: string,
    days: number = 30
  ): Promise<InsightsDashboardData> {
    const db = await getDb()
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const endDate = new Date()

    // Fetch reviews for period
    const query: any = { userId }
    if (locationId) {
      query.locationId = new ObjectId(locationId)
    }
    query.reviewCreatedAt = { $gte: startDate, $lte: endDate }

    const reviews = await db
      .collection('reviews')
      .find(query)
      .sort({ reviewCreatedAt: -1 })
      .toArray()

    if (reviews.length === 0) {
      return this.getEmptyInsights(startDate, endDate)
    }

    // Analyze all reviews for sentiment
    const sentimentResults = await sentimentAnalyzer.analyzeBatch(
      reviews.map((r: any) => ({ id: r._id.toString(), text: r.comment || r.reviewText || '' }))
    )

    // Build results
    return {
      period: { startDate, endDate, totalDays: days },
      overview: this.buildOverview(reviews),
      sentiment: this.buildSentimentAnalysis(sentimentResults, reviews),
      emotions: this.buildEmotionBreakdown(sentimentResults),
      ratings: this.buildRatingsAnalysis(reviews),
      topIssues: this.extractTopIssues(sentimentResults, reviews),
      topPraise: this.extractTopPraise(sentimentResults, reviews),
      alerts: this.buildAlertSummary(reviews),
      performance: this.buildPerformance(reviews),
      recommendations: this.generateRecommendations(reviews, sentimentResults),
      language_distribution: this.buildLanguageDistribution(reviews),
    }
  }

  /**
   * Build overview metrics
   */
  private buildOverview(reviews: any[]) {
    const replied = reviews.filter((r: any) => r.status === 'replied').length
    const totalResponseTime: number[] = []

    reviews.forEach((r: any) => {
      if (r.repliedAt && r.reviewCreatedAt) {
        const time = (r.repliedAt.getTime() - r.reviewCreatedAt.getTime()) / (1000 * 60)
        totalResponseTime.push(time)
      }
    })

    return {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length,
      responseRate: (replied / reviews.length) * 100,
      avgResponseTime: totalResponseTime.length > 0 ? Math.round(totalResponseTime.reduce((a, b) => a + b, 0) / totalResponseTime.length) : 0,
    }
  }

  /**
   * Build sentiment analysis with trend
   */
  private buildSentimentAnalysis(sentimentResults: any[], reviews: any[]) {
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    }

    sentimentResults.forEach((r: any) => {
      sentimentCounts[r.sentiment]++
    })

    // Calculate trend (last 7 days vs previous 7 days)
    const mid = Math.floor(reviews.length / 2)
    const recentSentiment = sentimentResults.slice(0, mid)
    const olderSentiment = sentimentResults.slice(mid)

    const recentNegative = recentSentiment.filter((r: any) => r.sentiment === 'negative').length / recentSentiment.length
    const olderNegative = olderSentiment.filter((r: any) => r.sentiment === 'negative').length / olderSentiment.length

    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    let changePercent = 0

    if (recentNegative < olderNegative * 0.9) {
      trend = 'improving'
      changePercent = ((olderNegative - recentNegative) / olderNegative) * 100
    } else if (recentNegative > olderNegative * 1.1) {
      trend = 'declining'
      changePercent = ((recentNegative - olderNegative) / olderNegative) * 100
    }

    return {
      positive: sentimentCounts.positive,
      neutral: sentimentCounts.neutral,
      negative: sentimentCounts.negative,
      trend,
      changePercent: Math.round(changePercent),
    }
  }

  /**
   * Emotion breakdown
   */
  private buildEmotionBreakdown(sentimentResults: any[]) {
    const emotions: Record<string, number> = {
      joy: 0,
      frustration: 0,
      gratitude: 0,
      disappointment: 0,
      anger: 0,
      surprise: 0,
      neutral: 0,
    }

    sentimentResults.forEach((r: any) => {
      emotions[r.emotion]++
    })

    return emotions
  }

  /**
   * Rating distribution and recovery
   */
  private buildRatingsAnalysis(reviews: any[]) {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((r: any) => {
      distribution[r.rating]++
    })

    // Average by day
    const byDay: Record<string, { sum: number; count: number }> = {}
    reviews.forEach((r: any) => {
      const day = r.reviewCreatedAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { sum: 0, count: 0 }
      byDay[day].sum += r.rating
      byDay[day].count++
    })

    const averageByDay = Object.entries(byDay)
      .map(([date, data]) => ({
        date,
        avg: Math.round((data.sum / data.count) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Recovered reviews (rating improved after reply)
    const recovered = reviews.filter((r: any) => r.ratingRecovered).length

    return {
      distribution,
      averageByDay,
      recoveredReviews: recovered,
    }
  }

  /**
   * Extract top issues from negative reviews
   */
  private extractTopIssues(sentimentResults: any[], reviews: any[]) {
    const issueMap: Record<string, { frequency: number; reviews: number }> = {}

    sentimentResults
      .filter((r: any) => r.sentiment === 'negative')
      .forEach((r: any) => {
        r.keyPhrases?.forEach((phrase: string) => {
          if (!issueMap[phrase]) {
            issueMap[phrase] = { frequency: 0, reviews: 0 }
          }
          issueMap[phrase].frequency++
          issueMap[phrase].reviews++
        })
      })

    return Object.entries(issueMap)
      .map(([issue, data]) => ({
        issue,
        frequency: data.frequency,
        severity: data.frequency > 5 ? 'high' : data.frequency > 2 ? 'medium' : 'low',
        relatedReviews: data.reviews,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  /**
   * Extract top praises from positive reviews
   */
  private extractTopPraise(sentimentResults: any[], reviews: any[]) {
    const praiseMap: Record<string, { frequency: number; reviews: number }> = {}

    sentimentResults
      .filter((r: any) => r.sentiment === 'positive')
      .forEach((r: any) => {
        r.keyPhrases?.forEach((phrase: string) => {
          if (!praiseMap[phrase]) {
            praiseMap[phrase] = { frequency: 0, reviews: 0 }
          }
          praiseMap[phrase].frequency++
          praiseMap[phrase].reviews++
        })
      })

    return Object.entries(praiseMap)
      .map(([praise, data]) => ({
        praise,
        frequency: data.frequency,
        impact: data.frequency > 5 ? 'high' : data.frequency > 2 ? 'medium' : 'low',
        relatedReviews: data.reviews,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
  }

  /**
   * Build alert summary
   */
  private buildAlertSummary(reviews: any[]) {
    const lowRatings = reviews.filter((r: any) => r.rating <= 2)
    const unreplied = lowRatings.filter((r: any) => r.status !== 'replied')

    let avgTimeFirstReply = 0
    const times: number[] = []
    lowRatings.forEach((r: any) => {
      if (r.repliedAt && r.reviewCreatedAt) {
        times.push((r.repliedAt.getTime() - r.reviewCreatedAt.getTime()) / (1000 * 60))
      }
    })
    if (times.length > 0) {
      avgTimeFirstReply = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    }

    return {
      totalLowRatingAlerts: lowRatings.length,
      unrepliedLowRatings: unreplied.length,
      averageTimeToFirstReply: avgTimeFirstReply,
    }
  }

  /**
   * Performance analysis
   */
  private buildPerformance(reviews: any[]) {
    // Group by day
    const byDay: Record<string, { reviews: number; ratings: number[] }> = {}
    reviews.forEach((r: any) => {
      const day = r.reviewCreatedAt.toISOString().split('T')[0]
      if (!byDay[day]) byDay[day] = { reviews: 0, ratings: [] }
      byDay[day].reviews++
      byDay[day].ratings.push(r.rating)
    })

    const dayStats = Object.entries(byDay).map(([date, data]) => ({
      date,
      reviews: data.reviews,
      avgRating: Math.round((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length) * 10) / 10,
    }))

    const bestDay = dayStats.sort((a, b) => b.avgRating - a.avgRating)[0] || dayStats[0]
    const worstDay = dayStats.sort((a, b) => a.avgRating - b.avgRating)[0] || dayStats[0]

    return {
      bestDay,
      worstDay,
      locations: [], // Can be populated if multi-location
    }
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(reviews: any[], sentimentResults: any[]) {
    const recommendations: any[] = []

    const negativeCount = sentimentResults.filter((r: any) => r.sentiment === 'negative').length
    const negativePercent = (negativeCount / sentimentResults.length) * 100

    if (negativePercent > 30) {
      recommendations.push({
        type: 'priority',
        title: 'High Negative Sentiment',
        description: `${Math.round(negativePercent)}% of recent reviews are negative. Consider reviewing common pain points.`,
        impact: 0.9,
        actionUrl: '/dashboard/insights?tab=issues',
      })
    }

    const unrepliedCount = reviews.filter((r: any) => r.status !== 'replied' && r.rating <= 2).length
    if (unrepliedCount > 0) {
      recommendations.push({
        type: 'priority',
        title: 'Unreplied Low-Rating Reviews',
        description: `${unrepliedCount} low-rating reviews are waiting for replies. Quick response can improve ratings.`,
        impact: 0.85,
        actionUrl: '/dashboard/reviews?filter=unreplied_low',
      })
    }

    const responseRate = (reviews.filter((r: any) => r.status === 'replied').length / reviews.length) * 100
    if (responseRate < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Improve Response Rate',
        description: `Current response rate is ${Math.round(responseRate)}%. Aim for >80% to boost customer satisfaction.`,
        impact: 0.7,
      })
    }

    const positiveCount = sentimentResults.filter((r: any) => r.sentiment === 'positive').length
    if (positiveCount > negativeCount * 2) {
      recommendations.push({
        type: 'opportunity',
        title: 'Encourage More 5-Star Reviews',
        description: 'Strong positive sentiment! Encourage happy customers to leave reviews to boost average rating.',
        impact: 0.6,
        actionUrl: '/dashboard/campaigns/review-request',
      })
    }

    return recommendations.slice(0, 4)
  }

  /**
   * Language distribution
   */
  private buildLanguageDistribution(reviews: any[]) {
    const langs: Record<string, number> = {}
    reviews.forEach((r: any) => {
      const lang = r.detectedLanguage || 'unknown'
      langs[lang] = (langs[lang] || 0) + 1
    })
    return langs
  }

  /**
   * Empty insights for no data
   */
  private getEmptyInsights(startDate: Date, endDate: Date): InsightsDashboardData {
    return {
      period: { startDate, endDate, totalDays: 30 },
      overview: { totalReviews: 0, averageRating: 0, responseRate: 0, avgResponseTime: 0 },
      sentiment: { positive: 0, neutral: 0, negative: 0, trend: 'stable', changePercent: 0 },
      emotions: { joy: 0, frustration: 0, gratitude: 0, disappointment: 0, anger: 0, surprise: 0, neutral: 0 },
      ratings: { distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, averageByDay: [], recoveredReviews: 0 },
      topIssues: [],
      topPraise: [],
      alerts: { totalLowRatingAlerts: 0, unrepliedLowRatings: 0, averageTimeToFirstReply: 0 },
      performance: { bestDay: { date: '', reviews: 0, avgRating: 0 }, worstDay: { date: '', reviews: 0, avgRating: 0 }, locations: [] },
      recommendations: [],
      language_distribution: {},
    }
  }
}

export const insightsAggregator = new InsightsAggregator()
