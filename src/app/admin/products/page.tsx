'use client'

// Admin Products & Pricing hub: every product, price, and checkout metadata
// key is DB-driven and editable here — no payment gateway setup anywhere.

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Stack, Card, Button, Badge, Spinner } from '@/lib/design-system/components'
import { Package, Plus, Copy, ChevronDown, ChevronUp, Pencil, X, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/billing/config'
import { useAdminStudioChrome } from '@/components/admin-studio'

type Price = {
  id: string
  unit_amount: number
  currency: string
  interval_unit: string | null
  interval_count: number
  is_active: boolean
  metadata: Record<string, any>
  stripe_price_id: string | null
  created_at: string
}

type Product = {
  id: string
  key: string
  name: string
  description: string | null
  product_type: string
  is_subscription: boolean
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  product_prices: Price[]
}

const PRODUCT_TYPES = ['membership', 'intensive', 'storage', 'tokens', 'coaching', 'addon', 'other']

function intervalLabel(price: Price): string {
  if (!price.interval_unit) return 'one-time'
  const count = price.interval_count || 1
  return count === 1 ? `per ${price.interval_unit}` : `every ${count} ${price.interval_unit}s`
}

const inputClass = 'w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#39FF14] transition-colors'
const selectClass = 'bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#39FF14] transition-colors'

export default function ProductsAdminPage() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') === 'links' ? 'links' : 'products'
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useAdminStudioChrome({
    title: 'Products & Pricing',
    icon: Package,
    tabs: [
      { label: 'Products', path: '/admin/products', icon: Package, isActive: view === 'products' },
      { label: 'Checkout Links', path: '/admin/products?view=links', icon: Link2, isActive: view === 'links' },
    ],
  })

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProducts(data.products || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  return (
    <Container size="xl">
      <Stack gap="lg">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : view === 'products' ? (
          <ProductsTab
            products={products}
            expandedId={expandedId}
            onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
            onChanged={fetchProducts}
          />
        ) : (
          <LinkGeneratorTab products={products} />
        )}
      </Stack>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Products tab
// ---------------------------------------------------------------------------
function ProductsTab({ products, expandedId, onToggleExpand, onChanged }: {
  products: Product[]
  expandedId: string | null
  onToggleExpand: (id: string) => void
  onChanged: () => void
}) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <Stack gap="md">
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Product
        </Button>
      </div>

      {showCreate && (
        <CreateProductForm onDone={() => { setShowCreate(false); onChanged() }} onCancel={() => setShowCreate(false)} />
      )}

      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          expanded={expandedId === product.id}
          onToggleExpand={() => onToggleExpand(product.id)}
          onChanged={onChanged}
        />
      ))}
    </Stack>
  )
}

function CreateProductForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [productType, setProductType] = useState('other')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!key.trim() || !name.trim()) {
      toast.error('Key and name are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim(), name: name.trim(), description: description.trim(), productType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Product created')
      onDone()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" className="p-4 border-[#39FF14]/30">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <input className={inputClass} placeholder="key (e.g. my_product)" value={key} onChange={e => setKey(e.target.value.toLowerCase())} />
        <input className={inputClass} placeholder="Display name" value={name} onChange={e => setName(e.target.value)} />
        <select className={selectClass} value={productType} onChange={e => setProductType(e.target.value)}>
          {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className={inputClass} placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Create Product'}
        </Button>
      </div>
    </Card>
  )
}

function ProductCard({ product, expanded, onToggleExpand, onChanged }: {
  product: Product
  expanded: boolean
  onToggleExpand: () => void
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description || '')
  const [saving, setSaving] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)

  const activePrices = product.product_prices.filter(p => p.is_active)

  const patchProduct = async (updates: Record<string, unknown>) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await patchProduct({ name: name.trim(), description: description.trim() || null })
      toast.success('Product updated')
      setEditing(false)
      onChanged()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      await patchProduct({ is_active: !product.is_active })
      toast.success(product.is_active ? 'Product deactivated — hidden from checkout' : 'Product activated')
      onChanged()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    }
  }

  return (
    <Card variant="outlined" className={`p-4 ${product.is_active ? 'border-neutral-800' : 'border-neutral-800 opacity-60'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} />
              <input className={inputClass} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">{product.name}</span>
                <code className="text-xs text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded">{product.key}</code>
                <Badge variant="neutral" className="text-xs">{product.product_type}</Badge>
                {product.is_active
                  ? <Badge variant="success" className="text-xs">Active</Badge>
                  : <Badge variant="danger" className="text-xs">Inactive</Badge>}
              </div>
              {product.description && (
                <p className="text-xs text-neutral-500 mt-1">{product.description}</p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setName(product.name); setDescription(product.description || '') }}>
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit product">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToggleActive}>
                {product.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleExpand} aria-label="Show prices">
                <span className="text-xs mr-1">{activePrices.length} price{activePrices.length !== 1 ? 's' : ''}</span>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-neutral-800 pt-4 space-y-2">
          {product.product_prices.length === 0 && (
            <p className="text-xs text-neutral-500">No prices yet.</p>
          )}
          {product.product_prices
            .slice()
            .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.unit_amount - b.unit_amount)
            .map(price => (
              <PriceRow key={price.id} price={price} onChanged={onChanged} />
            ))}

          {showAddPrice ? (
            <AddPriceForm productId={product.id} onDone={() => { setShowAddPrice(false); onChanged() }} onCancel={() => setShowAddPrice(false)} />
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAddPrice(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Price
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

function PriceRow({ price, onChanged }: { price: Price; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState((price.unit_amount / 100).toFixed(2))
  const [intervalUnit, setIntervalUnit] = useState(price.interval_unit || '')
  const [metadataText, setMetadataText] = useState(JSON.stringify(price.metadata || {}, null, 2))
  const [saving, setSaving] = useState(false)

  const metaSummary = useMemo(() => {
    const m = price.metadata || {}
    const keys = ['payment_plan', 'plan_type', 'pack_key', 'addon_key', 'grant_amount', 'grant_unit']
    return keys.filter(k => m[k] !== undefined).map(k => `${k}=${m[k]}`).join(' · ')
  }, [price.metadata])

  const patchPrice = async (updates: Record<string, unknown>) => {
    const res = await fetch('/api/admin/products/prices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: price.id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
  }

  const handleSave = async () => {
    const cents = Math.round(parseFloat(amount) * 100)
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      await patchPrice({
        unitAmount: cents,
        intervalUnit: intervalUnit || null,
        metadata: metadataText,
      })
      toast.success('Price updated')
      setEditing(false)
      onChanged()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update price')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      await patchPrice({ isActive: !price.is_active })
      toast.success(price.is_active ? 'Price deactivated' : 'Price activated')
      onChanged()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update price')
    }
  }

  if (editing) {
    return (
      <div className="bg-neutral-950/80 rounded-xl p-3 border border-[#39FF14]/30 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Amount (USD)</label>
            <input className={inputClass} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Interval (empty = one-time)</label>
            <select className={`${selectClass} w-full`} value={intervalUnit} onChange={e => setIntervalUnit(e.target.value)}>
              <option value="">one-time</option>
              <option value="day">day</option>
              <option value="week">week</option>
              <option value="month">month</option>
              <option value="year">year</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Metadata (JSON — payment_plan, plan_type, pack_key, addon_key, grant_amount…)</label>
          <textarea
            className={`${inputClass} font-mono text-xs min-h-[110px]`}
            value={metadataText}
            onChange={e => setMetadataText(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save Price'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-neutral-950/80 rounded-xl px-3 py-2.5 border border-neutral-800/80 ${!price.is_active ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">{formatPrice(price.unit_amount)}</span>
          <span className="text-xs text-neutral-500">{intervalLabel(price)}</span>
          {!price.is_active && <Badge variant="danger" className="text-xs">Inactive</Badge>}
        </div>
        {metaSummary && <p className="text-[11px] text-neutral-500 mt-0.5 break-all">{metaSummary}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit price">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleToggleActive}>
          {price.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  )
}

function AddPriceForm({ productId, onDone, onCancel }: { productId: string; onDone: () => void; onCancel: () => void }) {
  const [amount, setAmount] = useState('')
  const [intervalUnit, setIntervalUnit] = useState('')
  const [metadataText, setMetadataText] = useState('{}')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const cents = Math.round(parseFloat(amount) * 100)
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/products/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          unitAmount: cents,
          intervalUnit: intervalUnit || null,
          metadata: metadataText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Price created')
      onDone()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create price')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-neutral-950/80 rounded-xl p-3 border border-[#39FF14]/30 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Amount (USD)</label>
          <input className={inputClass} placeholder="499.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Interval (empty = one-time)</label>
          <select className={`${selectClass} w-full`} value={intervalUnit} onChange={e => setIntervalUnit(e.target.value)}>
            <option value="">one-time</option>
            <option value="day">day</option>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Metadata (JSON)</label>
        <textarea
          className={`${inputClass} font-mono text-xs min-h-[90px]`}
          value={metadataText}
          onChange={e => setMetadataText(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Create Price'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checkout link generator
// ---------------------------------------------------------------------------
function LinkGeneratorTab({ products }: { products: Product[] }) {
  const [productKey, setProductKey] = useState('intensive')
  const [plan, setPlan] = useState('full')
  const [continuity, setContinuity] = useState('28day')
  const [planType, setPlanType] = useState('solo')
  const [packKey, setPackKey] = useState('')
  const [promo, setPromo] = useState('')

  const activeProducts = products.filter(p => p.is_active)
  const selectedProduct = activeProducts.find(p => p.key === productKey)
  const isIntensive = productKey === 'intensive' || productKey === 'intensive_premium'
  const isTokenPack = productKey === 'token-pack'

  const packKeys = useMemo(() => {
    const tokenProduct = products.find(p => p.key === 'tokens')
    return (tokenProduct?.product_prices || [])
      .filter(p => p.is_active && p.metadata?.pack_key)
      .map(p => String(p.metadata.pack_key))
  }, [products])

  const url = useMemo(() => {
    const params = new URLSearchParams({ product: productKey })
    if (isIntensive) {
      params.set('plan', plan)
      params.set('continuity', continuity)
      params.set('planType', planType)
    }
    if (isTokenPack && packKey) params.set('packKey', packKey)
    if (promo.trim()) params.set('promo', promo.trim().toUpperCase())
    return `https://vibrationfit.com/checkout?${params.toString()}`
  }, [productKey, plan, continuity, planType, packKey, promo, isIntensive, isTokenPack])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    toast.success('Checkout link copied')
  }

  return (
    <Card variant="outlined" className="p-5 border-neutral-800">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Product</label>
          <select className={`${selectClass} w-full`} value={productKey} onChange={e => setProductKey(e.target.value)}>
            <option value="intensive">intensive</option>
            <option value="intensive_premium">intensive_premium</option>
            <option value="token-pack">token-pack</option>
            {activeProducts
              .filter(p => !['intensive', 'intensive_premium', 'tokens'].includes(p.key))
              .map(p => <option key={p.id} value={p.key}>{p.key}</option>)}
          </select>
        </div>
        {isIntensive && (
          <>
            <div>
              <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Payment plan</label>
              <select className={`${selectClass} w-full`} value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="full">full (one payment)</option>
                <option value="2pay">2pay (two payments)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Continuity</label>
              <select className={`${selectClass} w-full`} value={continuity} onChange={e => setContinuity(e.target.value)}>
                <option value="28day">28-day</option>
                <option value="annual">annual</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Plan type</label>
              <select className={`${selectClass} w-full`} value={planType} onChange={e => setPlanType(e.target.value)}>
                <option value="solo">solo</option>
                <option value="household">household</option>
              </select>
            </div>
          </>
        )}
        {isTokenPack && (
          <div>
            <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Pack</label>
            <select className={`${selectClass} w-full`} value={packKey} onChange={e => setPackKey(e.target.value)}>
              <option value="">select a pack…</option>
              {packKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-[11px] text-neutral-500 uppercase tracking-wide">Promo code (optional)</label>
          <input className={inputClass} placeholder="LAUNCH50" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} />
        </div>
      </div>

      {selectedProduct && !isIntensive && !isTokenPack && (
        <p className="text-xs text-yellow-500/80 mb-3">
          Note: checkout currently resolves intensives and token packs. Other product keys need a checkout resolver before this link will work.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center bg-neutral-950/80 rounded-xl px-3 py-2.5 border border-neutral-800">
        <code className="text-xs text-[#39FF14] break-all flex-1">{url}</code>
        <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Copy
        </Button>
      </div>
    </Card>
  )
}
