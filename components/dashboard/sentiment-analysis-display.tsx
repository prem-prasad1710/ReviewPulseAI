'use client'

import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  emotion: string
  emotionConfidence: number
  detectedLanguage: string
  keyPhrases: string[]
  urgency: 'low' | 'medium' | 'high'
  summary: string
}

interface SentimentAnalysisDisplayProps {
  reviewText?: string
  autoAnalyze?: boolean
  onAnalysisComplete?: (result: SentimentResult) => void
}

export function SentimentAnalysisDisplay({
  reviewText,
  autoAnalyze = false,
  onAnalysisComplete,
}: SentimentAnalysisDisplayProps) {
  const { t } = useTranslation()
  const [result, setResult] = useState<SentimentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoAnalyze && reviewText) {
      analyzeReview()
    }
  }, [autoAnalyze, reviewText])

  const analyzeReview = async () => {
    if (!reviewText || reviewText.trim().length === 0) {
      setError('Please enter review text')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reviewText }),
      })

      if (!response.ok) throw new Error('Failed to analyze sentiment')

      const { data } = await response.json()
      setResult(data)
      onAnalysisComplete?.(data)
    } catch (err) {
      console.error('Error analyzing sentiment:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50'
      case 'negative':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription>AI-powered multilingual sentiment detection for reviews</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!result && (
          <div className="space-y-3">
            <textarea
              placeholder="Paste review text here for sentiment analysis..."
              value={reviewText || ''}
              className="w-full px-3 py-2 border rounded-lg min-h-24 resize-none"
              disabled={loading}
            />
            <button
              onClick={analyzeReview}
              disabled={loading || !reviewText}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-gray-400 transition"
            >
              {loading ? 'Analyzing...' : '🔍 Analyze Sentiment'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className={`${getSentimentBg(result.sentiment)} p-6 rounded-lg border-2`}>
            {/* Sentiment Score */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium mb-1">Sentiment</p>
                <p className={`text-3xl font-bold ${getSentimentColor(result.sentiment)}`}>
                  {result.sentiment.toUpperCase()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Score: {(result.sentimentScore * 100).toFixed(0)}%
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 uppercase font-medium mb-1">Emotion</p>
                <p className="text-2xl">{result.emotion}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Confidence: {(result.emotionConfidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Urgency Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(result.urgency)}`}>
                Urgency: {result.urgency.toUpperCase()}
              </span>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="bg-white bg-opacity-60 p-3 rounded mb-4">
                <p className="text-sm font-medium mb-1 text-gray-700">Summary:</p>
                <p className="text-sm text-gray-600">{result.summary}</p>
              </div>
            )}

            {/* Language */}
            <div className="text-xs text-gray-600">
              Detected Language:{' '}
              <span className="font-medium">
                {result.detectedLanguage === 'english'
                  ? '🇬🇧 English'
                  : result.detectedLanguage === 'hindi'
                    ? '🇮🇳 Hindi'
                    : '🇮🇳 Hinglish'}
              </span>
            </div>

            {/* Key Phrases */}
            {result.keyPhrases && result.keyPhrases.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 uppercase font-medium mb-2">Key Phrases</p>
                <div className="flex flex-wrap gap-2">
                  {result.keyPhrases.map((phrase, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-medium text-gray-700">
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={() => setResult(null)}
              className="mt-4 w-full px-3 py-2 text-sm bg-white bg-opacity-40 hover:bg-opacity-60 rounded text-gray-700 font-medium transition"
            >
              Analyze Another Review
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
