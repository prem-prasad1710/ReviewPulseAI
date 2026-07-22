import { getAppUrl } from '@/lib/app-url'
import { APP_NAME, APP_TAGLINE, SUPPORT_EMAIL } from '@/lib/brand'

type LandingJsonLdProps = {
  appUrl?: string
}

export default function LandingJsonLd({ appUrl = getAppUrl() }: LandingJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: APP_NAME,
        url: appUrl,
        logo: `${appUrl}/brand/logo-icon.png`,
        description: APP_TAGLINE,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: SUPPORT_EMAIL,
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: appUrl,
        description:
          'Google Business Profile review inbox with AI-assisted replies in English and Hindi for Indian SMBs.',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: '999',
          description: 'Starter plan from ₹999/month',
        },
      },
      {
        '@type': 'WebSite',
        name: APP_NAME,
        url: appUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${appUrl}/tools/free-reply`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
