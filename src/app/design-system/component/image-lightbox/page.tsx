'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { 
  Stack, 
  Card, 
  Button, 
  ImageLightbox,
  Grid,
  Container,
  Inline,
  Icon,
  Badge,
  Input,
  type ImageLightboxImage
} from '@/lib/design-system/components'

const SAMPLE_IMAGES: ImageLightboxImage[] = [
  {
    url: 'https://media.vibrationfit.com/site-assets/images/fishing/img-0198.jpg',
    alt: 'Fishing memory 1'
  },
  {
    url: 'https://media.vibrationfit.com/site-assets/images/fishing/img-2797.jpg',
    alt: 'Fishing memory 2'
  },
  {
    url: 'https://media.vibrationfit.com/site-assets/images/fishing/img-7034-2.jpg',
    alt: 'Fishing memory 3'
  },
  {
    url: 'https://media.vibrationfit.com/site-assets/images/fishing/img-8729.jpg',
    alt: 'Fishing memory 4'
  },
  {
    url: 'https://media.vibrationfit.com/site-assets/images/fishing/img-9927.jpg',
    alt: 'Fishing memory 5'
  }
]

export default function ImageLightboxShowcase() {
  const router = useRouter()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCopyButton, setShowCopyButton] = useState(true)
  const [showNavigation, setShowNavigation] = useState(true)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [showNumbers, setShowNumbers] = useState(true)
  const [showCounter, setShowCounter] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [actionButtonText, setActionButtonText] = useState('Copy Link')
  const [subtitleText, setSubtitleText] = useState('')
  const [copiedImport, setCopiedImport] = useState(false)

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const importStatement = `import { ImageLightbox, type ImageLightboxImage } from '@/lib/design-system/components'`

  const copyImport = () => {
    navigator.clipboard.writeText(importStatement)
    setCopiedImport(true)
    setTimeout(() => setCopiedImport(false), 2000)
  }

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Header */}
        <Card className="p-4 md:p-6">
          <Stack gap="md">
            <Inline gap="sm" className="flex-wrap items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/design-system')}
                className="flex items-center gap-2"
              >
                <Icon icon={ArrowLeft} size="sm" />
                Back to All Components
              </Button>
              <Badge variant="primary">Media</Badge>
            </Inline>

            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                Image Lightbox
              </h1>
              <p className="text-sm md:text-base text-neutral-400">
                Full-screen image viewer with navigation, thumbnails, and copy link functionality
              </p>
            </div>

            {/* Import Statement */}
            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
              <div className="flex items-center justify-between gap-4">
                <code className="text-xs md:text-sm text-primary-400 font-mono flex-1">
                  {importStatement}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyImport}
                  className="flex-shrink-0"
                >
                  {copiedImport ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Stack>
        </Card>
        {/* Interactive Demo */}
        <Card>
          <Stack gap="md">
            <h3 className="text-xl font-semibold text-white">Interactive Demo</h3>
            <p className="text-sm text-neutral-400">
              Click any image to open the lightbox. Use arrow keys or buttons to navigate.
            </p>

            {/* Image Grid */}
            <Grid responsiveCols={{ mobile: 2, desktop: 4 }} gap="md">
              {SAMPLE_IMAGES.map((image, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-neutral-700 hover:border-primary-500 transition-colors group"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Click to view</span>
                  </div>
                </button>
              ))}
            </Grid>

            {/* Controls */}
            <div className="space-y-3 pt-4 border-t border-neutral-700">
              <h4 className="text-sm font-semibold text-white">Lightbox Options</h4>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCopyButton}
                    onChange={(e) => setShowCopyButton(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Copy Button
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNavigation}
                    onChange={(e) => setShowNavigation(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Navigation Arrows
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showThumbnails}
                    onChange={(e) => setShowThumbnails(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Thumbnails
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Numbers on Thumbnails
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCounter}
                    onChange={(e) => setShowCounter(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Image Counter (e.g., "1 of 5")
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSubtitle}
                    onChange={(e) => setShowSubtitle(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-primary-500 focus:ring-primary-500"
                  />
                  Show Subtitle Text
                </label>
              </div>
              
              {/* Text Input Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Action Button Text
                  </label>
                  <Input
                    value={actionButtonText}
                    onChange={(e) => setActionButtonText(e.target.value)}
                    placeholder="Copy Link"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Subtitle Text (optional)
                  </label>
                  <Input
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    placeholder="Optional subtitle below image"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Props Documentation */}
        <Card>
          <Stack gap="md">
            <h3 className="text-xl font-semibold text-white">Props</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">Prop</th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">Type</th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">Default</th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">images</td>
                    <td className="py-2 px-3 font-mono text-xs">ImageLightboxImage[]</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Array of images to display</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">currentIndex</td>
                    <td className="py-2 px-3 font-mono text-xs">number</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Index of currently displayed image</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">isOpen</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Controls lightbox visibility</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">onClose</td>
                    <td className="py-2 px-3 font-mono text-xs">() =&gt; void</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Called when lightbox is closed</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">onNavigate</td>
                    <td className="py-2 px-3 font-mono text-xs">(index: number) =&gt; void</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Called when user navigates to different image</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">showCopyButton</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">true</td>
                    <td className="py-2 px-3">Show copy link button</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">showNavigation</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">true</td>
                    <td className="py-2 px-3">Show navigation arrows</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">showThumbnails</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">true</td>
                    <td className="py-2 px-3">Show thumbnail strip</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">showNumbers</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">false</td>
                    <td className="py-2 px-3">Show numbers on thumbnail images</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">showCounter</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3">true</td>
                    <td className="py-2 px-3">Show image counter (e.g., "1 of 5")</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">actionButtonText</td>
                    <td className="py-2 px-3 font-mono text-xs">string</td>
                    <td className="py-2 px-3">"Copy Link"</td>
                    <td className="py-2 px-3">Text for the action button</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">actionButtonIcon</td>
                    <td className="py-2 px-3 font-mono text-xs">React.ReactNode</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Custom icon for action button</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">subtitleText</td>
                    <td className="py-2 px-3 font-mono text-xs">string</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Optional subtitle text below image</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">onCopy</td>
                    <td className="py-2 px-3 font-mono text-xs">(url: string) =&gt; void</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Called when link is copied</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Stack>
        </Card>

        {/* Usage Examples */}
        <Card>
          <Stack gap="md">
            <h3 className="text-xl font-semibold text-white">Usage Examples</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Basic Usage</h4>
                <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-neutral-300">{`const [lightboxOpen, setLightboxOpen] = useState(false)
const [currentIndex, setCurrentIndex] = useState(0)

const images = [
  { url: '/image1.jpg', alt: 'Image 1' },
  { url: '/image2.jpg', alt: 'Image 2' }
]

<ImageLightbox
  images={images}
  currentIndex={currentIndex}
  isOpen={lightboxOpen}
  onClose={() => setLightboxOpen(false)}
  onNavigate={setCurrentIndex}
/>`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">With Captions and Numbers</h4>
                <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-neutral-300">{`const images = [
  { 
    url: '/image1.jpg', 
    alt: 'Mountain', 
    caption: 'Beautiful mountain vista',
    number: 1 // Optional: custom number for thumbnail
  }
]`}</code>
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Custom Options</h4>
                <pre className="bg-neutral-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-neutral-300">{`<ImageLightbox
  images={images}
  currentIndex={currentIndex}
  isOpen={lightboxOpen}
  onClose={() => setLightboxOpen(false)}
  onNavigate={setCurrentIndex}
  showCopyButton={true}
  showThumbnails={true}
  showNumbers={true}
  showCounter={true}
  actionButtonText="Download"
  subtitleText="Click to save image"
  onCopy={(url) => console.log('Copied:', url)}
/>`}</code>
                </pre>
              </div>
            </div>
          </Stack>
        </Card>

        {/* Features */}
        <Card>
          <Stack gap="md">
            <h3 className="text-xl font-semibold text-white">Features</h3>
            <ul className="space-y-2 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Full-screen overlay with dark background</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Keyboard navigation (Arrow keys, Escape)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Click outside to close</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Previous/Next navigation arrows</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Thumbnail strip for quick navigation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Customizable action button with text and icon</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Image counter (e.g., "3 of 12")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Optional captions and subtitle text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Optional numbered thumbnails for multiselect workflows</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Responsive and mobile-friendly</span>
              </li>
            </ul>
          </Stack>
        </Card>
      </Stack>

      {/* Lightbox Instance */}
      <ImageLightbox
        images={SAMPLE_IMAGES}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
        showCopyButton={showCopyButton}
        showNavigation={showNavigation}
        showThumbnails={showThumbnails}
        showNumbers={showNumbers}
        showCounter={showCounter}
        actionButtonText={actionButtonText}
        subtitleText={showSubtitle ? subtitleText : undefined}
        onCopy={(url) => console.log('Copied:', url)}
      />
    </Container>
  )
}

