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
    promo: '',
    referral: '',
  })
  const [copied, setCopied] = useState(false)

  function handleParamChange(field: string, value: string) {
    setUtmParams((prev) => ({ ...prev, [field]: value }))
  }

  function buildURL(): string {
    const params = new URLSearchParams()

    if (utmParams.source) params.append('utm_source', utmParams.source)
    if (utmParams.medium) params.append('utm_medium', utmParams.medium)
    if (utmParams.campaign) {
      params.append('utm_campaign', utmParams.campaign)
      params.append('campaign', utmParams.campaign) // Also add campaign= for internal tracking
    }
    if (utmParams.content) params.append('utm_content', utmParams.content)
    if (utmParams.term) params.append('utm_term', utmParams.term)
    if (utmParams.promo) params.append('promo', utmParams.promo)
    if (utmParams.referral) params.append('ref', utmParams.referral)

    const queryString = params.toString()
    // Add #pricing anchor for intensive/promo links
    const needsPricingAnchor = utmParams.promo || utmParams.referral
    const anchor = needsPricingAnchor ? '#pricing' : ''
    return queryString ? `${baseUrl}?${queryString}${anchor}` : baseUrl
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
      promo: '',
      referral: '',
    })
  }

  function loadExample(example: string) {
    switch (example) {
      case 'visionpro':
        setUtmParams({
          source: 'partner_john',
          medium: 'affiliate',
          campaign: 'vision-pro-launch',
          content: 'hero-banner',
          term: '',
          promo: 'VISIONPRO50',
          referral: 'partner_john',
        })
        setBaseUrl('https://vibrationfit.com')
        break
      case 'intensive':
        setUtmParams({
          source: 'instagram',
          medium: 'social',
          campaign: 'intensive-launch',
          content: 'story-link',
          term: '',
          promo: 'INTENSIVE2025',
          referral: 'instagram_organic',
        })
        setBaseUrl('https://vibrationfit.com')
        break
      case 'household':
        setUtmParams({
          source: 'couples_workshop',
          medium: 'referral',
          campaign: 'household-intensive',
          content: 'workshop-link',
          term: '',
          promo: 'INTENSIVE2025-HOUSEHOLD',
          referral: 'couples_coach',
        })
        setBaseUrl('https://vibrationfit.com?plan=household')
        break
      case 'affiliate':
        setUtmParams({
          source: 'affiliate_network',
          medium: 'referral',
          campaign: 'q1-2025',
          content: 'email-signature',
          term: '',
          promo: 'PARTNER25',
          referral: 'affiliate_jane_smith',
        })
        setBaseUrl('https://vibrationfit.com')
        break
      case 'facebook':
        setUtmParams({
          source: 'facebook',
          medium: 'cpc',
          campaign: 'summer-2025',
          content: 'ad-variant-a',
          term: 'life-vision',
          promo: '',
          referral: '',
        })
        setBaseUrl('https://vibrationfit.com')
        break
      case 'email':
        setUtmParams({
          source: 'newsletter',
          medium: 'email',
          campaign: 'weekly-tips',
          content: 'cta-button',
          term: '',
          promo: '',
          referral: '',
        })
        setBaseUrl('https://vibrationfit.com')
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
        <div className="space-y-3">
          <div>
            <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">VibrationFit Products</p>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button variant="primary" size="sm" onClick={() => loadExample('visionpro')}>
                Vision Pro Affiliate
              </Button>
              <Button variant="accent" size="sm" onClick={() => loadExample('intensive')}>
                Solo Intensive
              </Button>
              <Button variant="accent" size="sm" onClick={() => loadExample('household')}>
                Household Intensive
              </Button>
              <Button variant="secondary" size="sm" onClick={() => loadExample('affiliate')}>
                Affiliate Partner
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Marketing Channels</p>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button variant="ghost" size="sm" onClick={() => loadExample('facebook')}>
                Facebook Ad
              </Button>
              <Button variant="ghost" size="sm" onClick={() => loadExample('email')}>
                Email Campaign
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Website URL</h2>
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://vibrationfit.com"
        />
        <p className="text-xs text-neutral-500 mt-2">
          💡 Tip: Add <code className="text-primary-500">?plan=household</code> to pre-select Household plan, or <code className="text-primary-500">?plan=solo</code> for Solo
        </p>
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

          <div className="pt-4 border-t border-[#333]">
            <h3 className="text-base font-semibold mb-4 text-primary-500">
              🎯 VibrationFit Tracking Parameters
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              <strong>Important:</strong> Use <code className="text-primary-500">promo=</code> (not promo_code) and <code className="text-primary-500">ref=</code> (not referral_source) for proper tracking!<br/>
              <strong>Note:</strong> "Free" intensive coupons should be <strong>$498 off</strong> (leaves $1 for payment verification), not 100% off.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Promo Code <span className="text-neutral-500">(promo)</span>
            </label>
            <Input
              value={utmParams.promo}
              onChange={(e) => handleParamChange('promo', e.target.value)}
              placeholder="INTENSIVE2025, BETA2024, PARTNER25"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Coupon/promo code for discounts - will auto-apply at checkout (e.g., INTENSIVE2025, VIPACCESS)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Referral Source <span className="text-neutral-500">(ref)</span>
            </label>
            <Input
              value={utmParams.referral}
              onChange={(e) => handleParamChange('referral', e.target.value)}
              placeholder="partner_john, affiliate_jane, instagram_organic"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Affiliate or partner identifier for commission tracking (e.g., partner_john, Jordan)
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
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-primary-500 mb-2">General UTM Guidelines</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                • <strong>Always use lowercase:</strong> UTM parameters are case-sensitive
              </li>
              <li>
                • <strong>Use hyphens or underscores:</strong> Separate words (e.g., summer-2025, partner_john)
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
          </div>
          <div className="pt-3 border-t border-[#333]">
            <h3 className="text-sm font-semibold text-accent-500 mb-2">VibrationFit Affiliate Tracking</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                • <strong>Promo Code (promo=):</strong> Use ALL CAPS for consistency (e.g., INTENSIVE2025, BETA2024)
              </li>
              <li>
                • <strong>Referral Source (ref=):</strong> Use lowercase with underscores (e.g., partner_john, Jordan)
              </li>
              <li>
                • <strong>Campaign Name (campaign=):</strong> Descriptive identifier (e.g., webinar_2024, beta_launch)
              </li>
              <li>
                • <strong>Auto-Apply:</strong> Promo codes are automatically applied at checkout (user sees FREE badge)
              </li>
              <li>
                • <strong>Database Tracking:</strong> All params saved to order_items and customer_subscriptions tables
              </li>
              <li>
                • <strong>Affiliate Reports:</strong> Use ref= parameter to calculate commissions and track performance
              </li>
            </ul>
          </div>
        </div>
      </Card>
      </Stack>
    </Container>
  )
}

