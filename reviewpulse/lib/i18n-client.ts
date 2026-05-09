/**
 * i18n Client Hook for Bilingual Support
 * Supports English, Hindi, and Hinglish
 */

import React, { useContext, createContext, ReactNode } from 'react'

export type Language = 'en' | 'hi' | 'hinglish'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const i18nContext = createContext<I18nContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  en: {
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.unknown_error': 'An unknown error occurred',
    'common.no_data': 'No data available',
    'common.no_issues': 'No issues found',
    'common.no_recommendations': 'No recommendations at this time',
    'common.take_action': 'Take Action',

    'sentiment.positive': 'Positive',
    'sentiment.negative': 'Negative',
    'sentiment.neutral': 'Neutral',

    'insights.total_reviews': 'Total Reviews',
    'insights.avg_rating': 'Average Rating',
    'insights.response_rate': 'Response Rate',
    'insights.sentiment_trend': 'Sentiment Trend',
    'insights.sentiment_breakdown': 'Sentiment Breakdown',
    'insights.rating_trend': 'Rating Trend Over Time',
    'insights.top_issues': 'Top Issues',
    'insights.common_complaints': 'Common complaints mentioned in negative reviews',
    'insights.related_reviews': 'Related Reviews',
    'insights.recommendations': 'Recommendations',
    'insights.action_items': 'Action items to improve your business',
    'insights.alert_summary': '⚠️ Alert Summary',
    'insights.low_rating_alerts': 'Low-Rating Alerts',
    'insights.unreplied_alerts': 'Unreplied Alerts',
    'insights.avg_reply_time': 'Avg First Reply Time',

    'reply.generate': 'Generate Reply',
    'reply.tone': 'Tone',
    'reply.language': 'Language',
    'reply.professional': 'Professional',
    'reply.friendly': 'Friendly',
    'reply.grateful': 'Grateful',
    'reply.formal': 'Formal',
    'reply.concise': 'Concise',
    'reply.copied': 'Reply copied to clipboard!',
    'reply.generating': 'Generating reply...',
  },

  hi: {
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.unknown_error': 'एक अज्ञात त्रुटि हुई',
    'common.no_data': 'कोई डेटा उपलब्ध नहीं',
    'common.no_issues': 'कोई समस्या नहीं मिली',
    'common.no_recommendations': 'इस समय कोई सिफारिशें नहीं',
    'common.take_action': 'कार्रवाई करें',

    'sentiment.positive': 'सकारात्मक',
    'sentiment.negative': 'नकारात्मक',
    'sentiment.neutral': 'तटस्थ',

    'insights.total_reviews': 'कुल रिव्यू',
    'insights.avg_rating': 'औसत रेटिंग',
    'insights.response_rate': 'प्रतिक्रिया दर',
    'insights.sentiment_trend': 'भावना प्रवृत्ति',
    'insights.sentiment_breakdown': 'भावना विश्लेषण',
    'insights.rating_trend': 'समय के साथ रेटिंग ट्रेंड',
    'insights.top_issues': 'शीर्ष समस्याएं',
    'insights.common_complaints': 'नकारात्मक रिव्यू में आम शिकायतें',
    'insights.related_reviews': 'संबंधित रिव्यू',
    'insights.recommendations': 'सिफारिशें',
    'insights.action_items': 'आपके व्यवसाय में सुधार के लिए कदम',
    'insights.alert_summary': '⚠️ अलर्ट सारांश',
    'insights.low_rating_alerts': 'कम रेटिंग अलर्ट',
    'insights.unreplied_alerts': 'अनुत्तरित अलर्ट',
    'insights.avg_reply_time': 'औसत पहली रिप्लाई का समय',

    'reply.generate': 'रिप्लाई जेनरेट करें',
    'reply.tone': 'टोन',
    'reply.language': 'भाषा',
    'reply.professional': 'पेशेवार',
    'reply.friendly': 'मैत्रीपूर्ण',
    'reply.grateful': 'कृतज्ञ',
    'reply.formal': 'औपचारिक',
    'reply.concise': 'संक्षिप्त',
    'reply.copied': 'रिप्लाई कॉपी हो गया!',
    'reply.generating': 'रिप्लाई जेनरेट हो रहा है...',
  },

  hinglish: {
    'common.loading': 'Load ho raha hai...',
    'common.error': 'Error',
    'common.unknown_error': 'Kuch galat ho gaya',
    'common.no_data': 'Koi data nahi',
    'common.no_issues': 'Koi masla nahi mila',
    'common.no_recommendations': 'Abhi koi suggestion nahi',
    'common.take_action': 'Action Lo',

    'sentiment.positive': 'Acha',
    'sentiment.negative': 'Bekaar',
    'sentiment.neutral': 'Normal',

    'insights.total_reviews': 'Total Reviews',
    'insights.avg_rating': 'Average Rating',
    'insights.response_rate': 'Reply %',
    'insights.sentiment_trend': 'Sentiment Trend',
    'insights.sentiment_breakdown': 'Sentiment Breakdown',
    'insights.rating_trend': 'Rating Trend',
    'insights.top_issues': 'Top Problems',
    'insights.common_complaints': 'Common complaints',
    'insights.related_reviews': 'Related Reviews',
    'insights.recommendations': 'Suggestions',
    'insights.action_items': 'Action Items',
    'insights.alert_summary': '⚠️ Alert Summary',
    'insights.low_rating_alerts': 'Low Reviews',
    'insights.unreplied_alerts': 'No Reply',
    'insights.avg_reply_time': 'Avg Reply Time',

    'reply.generate': 'Reply Banao',
    'reply.tone': 'Tone',
    'reply.language': 'Language',
    'reply.professional': 'Professional',
    'reply.friendly': 'Friendly',
    'reply.grateful': 'Thank You',
    'reply.formal': 'Formal',
    'reply.concise': 'Short & Sweet',
    'reply.copied': 'Reply copy ho gaya!',
    'reply.generating': 'Reply ban raha hai...',
  },
}

export function useTranslation() {
  const context = useContext(i18nContext)
  if (!context) {
    // Default to English if not wrapped
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => translations.en[key as keyof typeof translations.en] || key,
    }
  }
  return context
}

export function I18nProvider({ children, initialLanguage = 'en' }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguage] = React.useState<Language>(initialLanguage)

  const t = (key: string): string => {
    const bundle = translations[language] as Record<string, string>
    return bundle[key] || key
  }

  return React.createElement(i18nContext.Provider, { value: { language, setLanguage, t } }, children)
}
