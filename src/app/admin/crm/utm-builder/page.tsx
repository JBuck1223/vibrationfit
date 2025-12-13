// /src/app/admin/crm/utm-builder/page.tsx
// UTM Parameter Builder Tool

'use client'

import { useState } from 'react'
import { Button, Card, Input, Container, Stack, PageHero } from '@/lib/design-system/components'
import { Check, ArrowRight } from 'lucide-react'

export default function UTMBuilderPage() {
  const [baseUrl, setBaseUrl] = useState('https://vibrationfit.com')
  const [utmParams, setUtmParams] = useState({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
  })
  const [copied, setCopied] = useState(false)

  function handleParamChange(field: string, value: string) {
    setUtmParams((prev) => ({ ...prev, [field]: value }))
  }

  function buildURL(): string {
    const params = new URLSearchParams()

    if (utmParams.source) params.append('utm_source', utmParams.source)
    if (utmParams.medium) params.append('utm_medium', utmParams.medium)
    if (utmParams.campaign) params.append('utm_campaign', utmParams.campaign)
    if (utmParams.content) params.append('utm_content', utmParams.content)
    if (utmParams.term) params.append('utm_term', utmParams.term)

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  async function copyToClipboard() {
    const url = buildURL()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  function clearAll() {
    setUtmParams({
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
    })
  }

  function loadExample(example: string) {
    switch (example) {
      case 'facebook':
        setUtmParams({
          source: 'facebook',
          medium: 'cpc',
          campaign: 'summer-2025',
          content: 'ad-variant-a',
          term: 'life-vision',
        })
        break
      case 'google':
        setUtmParams({
          source: 'google',
          medium: 'cpc',
          campaign: 'brand-search',
          content: 'text-ad',
          term: 'vibration-fit',
        })
        break
      case 'email':
        setUtmParams({
          source: 'newsletter',
          medium: 'email',
          campaign: 'weekly-tips',
          content: 'cta-button',
          term: '',
        })
        break
      case 'instagram':
        setUtmParams({
          source: 'instagram',
          medium: 'social',
          campaign: 'summer-2025',
          content: 'story',
          term: '',
        })
        break
    }
  }

  const finalURL = buildURL()

  return (
    <Container size="lg">
      <Stack gap="lg">
        <PageHero title="UTM Builder" subtitle="Build custom campaign URLs with UTM tracking parameters" />
      <div className="mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">UTM Builder</h1>
        <p className="text-sm md:text-base text-neutral-400">
          Create campaign tracking URLs with UTM parameters
        </p>
      </div>

      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Quick Examples</h2>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button variant="ghost" size="sm" onClick={() => loadExample('facebook')}>
            Facebook Ad
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadExample('google')}>
            Google Ad
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadExample('email')}>
            Email Campaign
          </Button>
          <Button variant="ghost" size="sm" onClick={() => loadExample('instagram')}>
            Instagram
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </Card>

      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Website URL</h2>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://vibrationfit.com"
        />
      </Card>

      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">UTM Parameters</h2>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-xs md:text-sm font-medium mb-2">
              Campaign Source * <span className="text-neutral-500">(utm_source)</span>
            </label>
            <Input
              value={utmParams.source}
              onChange={(e) => handleParamChange('source', e.target.value)}
              placeholder="facebook, google, newsletter"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Identify the advertiser, site, publication, etc. (e.g., facebook, google, newsletter)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Medium * <span className="text-neutral-500">(utm_medium)</span>
            </label>
            <Input
              value={utmParams.medium}
              onChange={(e) => handleParamChange('medium', e.target.value)}
              placeholder="cpc, email, social, banner"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Advertising or marketing medium (e.g., cpc, email, social, banner)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Name * <span className="text-neutral-500">(utm_campaign)</span>
            </label>
            <Input
              value={utmParams.campaign}
              onChange={(e) => handleParamChange('campaign', e.target.value)}
              placeholder="summer-2025, product-launch"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Product, promo code, or slogan (e.g., summer-2025, product-launch)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Content <span className="text-neutral-500">(utm_content)</span>
            </label>
            <Input
              value={utmParams.content}
              onChange={(e) => handleParamChange('content', e.target.value)}
              placeholder="ad-variant-a, logo-link, text-link"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Differentiate ads or links (e.g., ad-variant-a, logo-link, text-link)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Term <span className="text-neutral-500">(utm_term)</span>
            </label>
            <Input
              value={utmParams.term}
              onChange={(e) => handleParamChange('term', e.target.value)}
              placeholder="life-vision, personal-growth"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Identify paid search keywords (e.g., life-vision, personal-growth)
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Generated URL</h2>

        <div className="bg-[#1F1F1F] p-3 md:p-4 rounded-xl mb-4 border border-[#333]">
          <code className="text-xs md:text-sm text-primary-500 break-all">{finalURL}</code>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Button variant="primary" size="sm" onClick={copyToClipboard} className="flex-1 sm:flex-none">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied!
              </>
            ) : (
              'Copy URL'
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(finalURL, '_blank')}
            className="flex-1 sm:flex-none"
          >
            <ArrowRight className="w-4 h-4 inline mr-1" />
            Test URL
          </Button>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Best Practices</h2>
        <ul className="space-y-2 text-sm md:text-base text-neutral-300">
          <li>
            • <strong>Always use lowercase:</strong> UTM parameters are case-sensitive
          </li>
          <li>
            • <strong>Use hyphens:</strong> Separate words with hyphens (e.g., summer-2025)
          </li>
          <li>
            • <strong>Be consistent:</strong> Use the same naming conventions across campaigns
          </li>
          <li>
            • <strong>Required fields:</strong> Source, Medium, and Campaign are essential
          </li>
          <li>
            • <strong>Content for A/B testing:</strong> Use utm_content to differentiate ad variants
          </li>
          <li>
            • <strong>Term for paid search:</strong> Track specific keywords with utm_term
          </li>
        </ul>
      </Card>
      </Stack>
    </Container>
  )
}

