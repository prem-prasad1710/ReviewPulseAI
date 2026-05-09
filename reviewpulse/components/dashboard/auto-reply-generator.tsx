'use client'

import React, { useState } from 'react'
import { useTranslation } from '@/lib/i18n-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

interface AutoReplyGeneratorProps {
  reviewId: string
  businessName: string
  businessCategory?: string
  reviewText: string
  reviewRating: number
  reviewerName?: string
  sentiment?: string
  onReplyGenerated?: (reply: string) => void
}

export function AutoReplyGenerator({
  reviewId,
  businessName,
  businessCategory,
  reviewText,
  reviewRating,
  reviewerName,
  sentiment,
  onReplyGenerated,
}: AutoReplyGeneratorProps) {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('english')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'grateful'>('professional')
  const [loading, setLoading] = useState(false)
  const [generatedReplies, setGeneratedReplies] = useState<Array<{ reply: string; tone: string }>>([])
  const [selectedReply, setSelectedReply] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const tones = ['professional', 'friendly', 'grateful'] as const

  const generateReply = async () => {
    try {
      setLoading(true)
      setGeneratedReplies([])

      const response = await fetch('/api/auto-reply/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessCategory: businessCategory || 'General Services',
          reviewText,
          reviewRating,
          reviewerName: reviewerName || 'Valued Customer',
          language,
          tone,
          sentiment: sentiment || 'neutral',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate reply')

      const { data } = await response.json()

      // For selected tone, show this reply and others
      const variantsResponse = await fetch('/api/auto-reply/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessCategory: businessCategory || 'General Services',
          reviewText,
          reviewRating,
          reviewerName: reviewerName || 'Valued Customer',
          language,
          sentiment: sentiment || 'neutral',
          count: 2,
        }),
      })

      if (variantsResponse.ok) {
        const { data: variants } = await variantsResponse.json()
        setGeneratedReplies(variants.map((v: any) => ({ reply: v.reply, tone: v.tone })))
      } else {
        setGeneratedReplies([{ reply: data.reply, tone: data.tone }])
      }

      setSelectedReply(data.reply)
      onReplyGenerated?.(data.reply)
    } catch (error) {
      console.error('Error generating reply:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reply.generate')}</CardTitle>
        <CardDescription>
          Customize the tone and language, then generate AI-powered replies
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Review Preview */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium">{reviewerName || 'Customer'}</h4>
            <span className="text-lg">{'⭐'.repeat(reviewRating)}</span>
          </div>
          <p className="text-sm text-gray-700">{reviewText}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('reply.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              <option value="english">🇬🇧 English</option>
              <option value="hindi">🇮🇳 हिंदी</option>
              <option value="hinglish">🇮🇳 Hinglish</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('reply.tone')}</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={loading}
            >
              {tones.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateReply}
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-medium text-white transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              {t('reply.generating')}
            </span>
          ) : (
            `✨ ${t('reply.generate')}`
          )}
        </button>

        {/* Generated Replies */}
        {generatedReplies.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Generated Variants:</h4>

            {generatedReplies.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedReply === item.reply
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedReply(item.reply)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase">{item.tone}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(item.reply)
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{item.reply}</p>
              </div>
            ))}

            {/* Action Button */}
            {selectedReply && (
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(selectedReply)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  ✓ {copied ? t('reply.copied') : 'Copy & Use'}
                </button>
                <button
                  onClick={generateReply}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                >
                  🔄 Generate More
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
