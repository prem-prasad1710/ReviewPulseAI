import { getAppUrl } from '@/lib/app-url'

type LandingJsonLdProps = {
  appUrl?: string
}

export default function LandingJsonLd({ appUrl = getAppUrl() }: LandingJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'ReviewPulse AI',
        url: appUrl,
        logo: `${appUrl}/brand/logo-icon.png`,
        description:
          'Google Business review inbox, bilingual AI replies, and reputation tools for Indian SMBs.',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@reviewpulse.in',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ReviewPulse AI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: appUrl,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: '299',
          description: 'Starter plan from ₹299/month',
        },
      },
      {
        '@type': 'WebSite',
        name: 'ReviewPulse AI',
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
