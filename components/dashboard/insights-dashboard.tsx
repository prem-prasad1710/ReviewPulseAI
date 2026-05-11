'use client'

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTranslation } from '@/lib/i18n-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardInsights {
  overview: any
  sentiment: any
  ratings: any
  topIssues: any[]
  topPraise: any[]
  recommendations: any[]
  alerts: any
}

export function InsightsDashboard({ locationId }: { locationId?: string }) {
  const [insights, setInsights] = useState<DashboardInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useTranslation()

  useEffect(() => {
    fetchInsights()
  }, [locationId])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (locationId) params.append('locationId', locationId)
      params.append('days', '30')

      const response = await fetch(`/api/insights/dashboard?${params}`)
      if (!response.ok) throw new Error('Failed to fetch insights')

      const { data } = await response.json()
      setInsights(data)
    } catch (err) {
      console.error('Error fetching insights:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !insights) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">{t('common.error')}</CardTitle>
          <CardDescription>{error || t('common.unknown_error')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981']
  const sentimentData = [
    { name: t('sentiment.positive'), value: insights.sentiment.positive },
    { name: t('sentiment.negative'), value: insights.sentiment.negative },
    { name: t('sentiment.neutral'), value: insights.sentiment.neutral },
  ]

  const ratingChartData = insights.ratings.averageByDay

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('insights.total_reviews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{insights.overview.totalReviews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('insights.avg_rating')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{insights.overview.averageRating.toFixed(1)}⭐</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('insights.response_rate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(insights.overview.responseRate)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{t('insights.sentiment_trend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              insights.sentiment.trend === 'improving' ? 'text-green-600' :
              insights.sentiment.trend === 'declining' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {insights.sentiment.trend === 'improving' ? '📈' : insights.sentiment.trend === 'declining' ? '📉' : '➡️'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.sentiment_breakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('insights.rating_trend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {ratingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ratingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">{t('common.no_data')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Issues and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('insights.top_issues')}</CardTitle>
            <CardDescription>{t('insights.common_complaints')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topIssues.length > 0 ? (
                insights.topIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 bg-red-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{issue.issue}</p>
                      <p className="text-xs text-gray-600">{t('insights.related_reviews')}: {issue.relatedReviews}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      issue.severity === 'high' ? 'bg-red-600 text-white' :
                      issue.severity === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {issue.severity.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">{t('common.no_issues')}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('insights.recommendations')}</CardTitle>
            <CardDescription>{t('insights.action_items')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.recommendations.length > 0 ? (
                insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                        rec.type === 'priority' ? 'bg-red-100 text-red-700' :
                        rec.type === 'improvement' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.type.toUpperCase()}
                      </span>
                    </div>
                    {rec.actionUrl && (
                      <a href={rec.actionUrl} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                        {t('common.take_action')} →
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">{t('common.no_recommendations')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Summary */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">{t('insights.alert_summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-amber-600">{insights.alerts.totalLowRatingAlerts}</p>
              <p className="text-sm text-amber-700">{t('insights.low_rating_alerts')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{insights.alerts.unrepliedLowRatings}</p>
              <p className="text-sm text-red-700">{t('insights.unreplied_alerts')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{insights.alerts.averageTimeToFirstReply}m</p>
              <p className="text-sm text-blue-700">{t('insights.avg_reply_time')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
