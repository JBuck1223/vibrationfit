const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { NextRequest } = require('next/server')
const { generateKeyPairSync, sign } = require('node:crypto')
const root = path.resolve(__dirname, '../..')

// Execute the real TypeScript routes with external services replaced locally.
function load(file, mocks = {}, cache = new Map()) {
  const filename = path.resolve(root, file)
  if (cache.has(filename)) return cache.get(filename).exports
  const mod = new Module(filename, module)
  cache.set(filename, mod)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  const baseRequire = mod.require.bind(mod)
  mod.require = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id]
    if (id.startsWith('@/') || id.startsWith('./') || id.startsWith('../')) {
      const target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id)
      const found = [target, target + '.ts', path.join(target, 'index.ts')].find(p => fs.existsSync(p) && fs.statSync(p).isFile())
      if (found?.endsWith('.ts')) return load(found, mocks, cache)
    }
    return baseRequire(id)
  }
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename)
  return mod.exports
}
const request = (url, body, method = 'POST') => new NextRequest(`https://app.example${url}`, body === undefined ? { method: 'GET' } : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const user = { id: 'member-a', email: 'member@example.test', user_metadata: { has_password: true } }
const auth = who => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: who } }) } }) })

for (const who of [null, user]) test(`legacy checkout return requires identity: ${!!who}`, async () => {
  const route = load('src/app/auth/auto-login/route.ts', { '@/lib/supabase/server': auth(who) })
  const res = await route.GET(request('/auth/auto-login?email=victim@example.test&session_id=madeup'))
  assert.equal(new URL(res.headers.get('location')).pathname, who ? '/begin' : '/auth/login')
  assert.ok(!res.headers.get('location').includes('token_hash'))
})

for (const scenario of ['anonymous', 'foreign', 'paid-stripe', 'paid-paypal', 'pending', 'settled-subscription']) test(`checkout status: ${scenario}`, async () => {
  let reads = 0
  const order = { id: 'order', user_id: scenario === 'foreign' ? 'victim' : user.id, status: scenario.startsWith('paid') ? 'paid' : 'pending', stripe_payment_intent_id: scenario === 'paid-paypal' ? null : 'pi_123', total_amount: 1000, currency: 'usd', metadata: {} }
  const db = { from() { reads++; return { select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: order }) } } }
  const route = load('src/app/api/checkout/status/route.ts', {
    '@supabase/supabase-js': { createClient: () => db },
    '@/lib/supabase/server': auth(scenario === 'anonymous' ? null : user),
    '@/lib/stripe/config': { stripe: { paymentIntents: { retrieve: async () => ({ status: scenario === 'settled-subscription' ? 'succeeded' : 'requires_payment_method' }) } } },
  })
  const res = await route.GET(request('/api/checkout/status?order_id=order'))
  const body = await res.json()
  if (scenario === 'anonymous') { assert.equal(reads, 0); assert.equal(body.requiresSignIn, true); assert.equal(body.ready, false) }
  else if (scenario === 'foreign') assert.equal(res.status, 403)
  else assert.equal(body.ready, scenario !== 'pending')
  assert.ok(!JSON.stringify(body).includes('token_hash'))
})

test('existing account subscription cannot change password/profile before authentication', async () => {
  let mutations = 0
  const route = load('src/app/api/checkout/create-intent/route.ts', {
    '@supabase/supabase-js': { createClient: () => ({ auth: { admin: { updateUserById() { mutations++ } } }, from() { mutations++; throw Error('unexpected mutation') } }) },
    '@/lib/stripe/config': { stripe: {} },
    '@/lib/stripe/customer': {}, '@/lib/utils': {}, '@/lib/tracking/customer-attribution': {},
    '@/lib/supabase/server': auth(null),
    '@/lib/supabase/get-user-by-email': { getUserIdByEmail: async () => 'victim' },
    '@/lib/checkout/activation-handoff': { isActivationId: () => false, currentSessionUserId: async () => null },
    '@/lib/billing/products': { resolveProduct: async () => ({ mode: 'subscription', amount: 100, stripePriceId: 'price', metadata: {} }) },
    '@/lib/billing/coupons': { resolveIntensiveLaunchPromoCode: () => null },
  })
  const res = await route.POST(request('/api/checkout/create-intent', { name: 'Attacker', email: 'victim@example.test', password: 'hijacked-password', product: 'intensive', plan: '2pay' }))
  assert.equal(res.status, 403)
  assert.equal(mutations, 0)
})

const policy = load('src/lib/security/storage-policy.ts')
test('storage ownership, nested folders, admin assets and ambiguous key encodings', () => {
  assert.equal(policy.canAccessStorageKey('user-uploads/member-a/journal/nested/photo.png', 'member-a'), true)
  assert.equal(policy.canAccessStorageKey('site-assets/logos/logo.svg', 'member-a', true), true)
  for (const key of ['user-uploads/member-ab/file', 'user-uploads/victim/file', 'site-assets/logo.png', 'user-uploads/member-a/../victim/file', 'user-uploads/member-a/%2e%2e/file', 'user-uploads/member-a/a\\b', 'user-uploads/member-a//file', null]) assert.equal(policy.canAccessStorageKey(key, 'member-a'), false, String(key))
})

for (const endpoint of ['presigned', 'multipart']) for (const scenario of ['anonymous', 'foreign', 'own', 'admin-asset', 'member-asset']) test(`storage route ${endpoint}: ${scenario}`, async () => {
  let awsCalls = 0
  const actor = scenario === 'anonymous' ? null : { user }
  const command = class { constructor(input) { this.input = input } }
  const aws = { S3Client: class { async send() { awsCalls++; return { UploadId: 'upload' } } } }
  for (const name of ['PutObjectCommand','CreateMultipartUploadCommand','UploadPartCommand','CompleteMultipartUploadCommand','AbortMultipartUploadCommand']) aws[name] = command
  const route = load(`src/app/api/upload/${endpoint}/route.ts`, {
    '@/lib/security/storage-access': { storageActor: async () => actor, storageKeyAllowed: async (_, key) => policy.canAccessStorageKey(key, user.id, scenario === 'admin-asset') },
    '@aws-sdk/client-s3': aws,
    '@aws-sdk/s3-request-presigner': { getSignedUrl: async () => { awsCalls++; return 'https://s3.example/signed' } },
  })
  const key = scenario.includes('asset') ? 'site-assets/video.mp4' : `user-uploads/${scenario === 'foreign' ? 'victim' : user.id}/video.mp4`
  for (const action of endpoint === 'multipart' ? ['create','getPartUrl','complete','abort'] : ['create']) {
    const res = await route.POST(request('/api/upload/' + endpoint, { key, fileType: 'video/mp4', action, uploadId: 'upload', partNumber: 1, parts: [{ ETag: 'etag', PartNumber: 1 }] }))
    assert.equal(res.status, scenario === 'anonymous' ? 401 : ['foreign','member-asset'].includes(scenario) ? 403 : 200)
  }
  assert.equal(awsCalls > 0, ['own','admin-asset'].includes(scenario))
})

const hooks = load('src/lib/security/webhooks.ts')
test('SNS accepts authentic notifications/confirmations and rejects forgery, wrong topic, hostile cert and redirects', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const topic = 'arn:aws:sns:us-east-1:123456789012:email'
  const cert = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-test.pem'
  const fetchKey = async (_url, opts) => { assert.equal(opts.redirect, 'error'); return new Response(publicKey.export({ type: 'spki', format: 'pem' })) }
  for (const Type of ['Notification','SubscriptionConfirmation']) for (const SignatureVersion of ['1','2']) {
    const msg = { Type, SignatureVersion, Message: 'hello\nworld', MessageId: 'id', Timestamp: new Date().toISOString(), TopicArn: topic, SigningCertURL: cert,
      ...(Type === 'Notification' ? { Subject: 'test' } : { Token: 'token', SubscribeURL: `https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=${encodeURIComponent(topic)}&Token=token` }) }
    msg.Signature = sign(SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256', Buffer.from(hooks.snsCanonicalMessage(msg)), privateKey).toString('base64')
    assert.equal(await hooks.validSnsMessage(msg, topic, fetchKey), true)
    for (const changed of [{ Message: 'forged' }, { SigningCertURL: 'https://localhost/key.pem' }, { SigningCertURL: cert + '?redirect=evil' }, { TopicArn: topic + 'evil' }, { SignatureVersion: '3' }]) assert.equal(await hooks.validSnsMessage({ ...msg, ...changed }, topic, fetchKey), false)
    assert.equal(await hooks.validSnsMessage(msg, undefined, fetchKey), false)
  }
})

test('Twilio verifies exact configured external URL and all form parameters', () => {
  const old = { token: process.env.TWILIO_AUTH_TOKEN, origin: process.env.WEBHOOK_PUBLIC_ORIGIN }
  process.env.TWILIO_AUTH_TOKEN = 'local-test-token'; process.env.WEBHOOK_PUBLIC_ORIGIN = 'https://app.example'
  try {
    const params = { From: '+15555555555', Body: 'STOP', MessageSid: 'SMtest' }
    const form = new FormData(); for (const [key, value] of Object.entries(params)) form.set(key, value)
    const url = 'https://app.example/api/webhooks/twilio-sms'
    const sig = require('twilio').getExpectedTwilioSignature('local-test-token', url, params)
    const req = new Request(url, { headers: { 'x-twilio-signature': sig } })
    assert.equal(hooks.validTwilioRequest(req, form), true)
    form.set('Body', 'forged'); assert.equal(hooks.validTwilioRequest(req, form), false)
    form.set('Body', 'STOP'); form.append('Body', 'forged'); assert.equal(hooks.validTwilioRequest(req, form), false)
    assert.equal(hooks.validTwilioRequest(new Request(url), form), false)
  } finally {
    for (const [key, value] of [['TWILIO_AUTH_TOKEN',old.token],['WEBHOOK_PUBLIC_ORIGIN',old.origin]]) value === undefined ? delete process.env[key] : process.env[key] = value
  }
})

const media = load('src/lib/security/media-fetch.ts')
test('media proxy blocks loopback, private addresses, metadata, mapped IPv6 and host confusion', () => {
  for (const url of ['http://media.vibrationfit.com/a','https://localhost/a','https://127.0.0.1/a','https://fal.media.evil.test/a','https://fal.media:9000/a','https://x@fal.media/a']) assert.equal(media.allowedMediaUrl(url), false)
  assert.equal(media.allowedMediaUrl('https://v3.fal.media/a'), true)
  for (const ip of ['127.0.0.1','10.0.0.1','169.254.169.254','172.16.0.1','192.168.0.1','::1','::ffff:127.0.0.1','fe80::1','fc00::1','2001:db8::1']) assert.equal(media.publicAddress(ip), false, ip)
  assert.equal(media.publicAddress('8.8.8.8'), true)
  assert.equal(media.publicAddress('2606:4700:4700::1111'), true)
  assert.match(media.inertMediaHeaders['Content-Security-Policy'], /^sandbox;/)
})

for (const who of [null, user]) test(`legacy upload/delete authenticates before AWS: ${!!who}`, async () => {
  let awsCalls = 0
  const actor = who ? { user: who } : null
  const command = class { constructor(input) { this.input = input } }
  const aws = { S3Client: class { async send() { awsCalls++; return { Buckets: [{ Name: 'vibration-fit-client-storage' }] } } } }
  for (const name of ['PutObjectCommand','DeleteObjectCommand','CreateMultipartUploadCommand','UploadPartCommand','CompleteMultipartUploadCommand','AbortMultipartUploadCommand','ListBucketsCommand']) aws[name] = command
  const route = load('src/app/api/upload/route.ts', {
    '@/lib/security/storage-access': { storageActor: async () => actor, storageKeyAllowed: async (_, key) => policy.canAccessStorageKey(key, user.id) },
    '@aws-sdk/client-s3': aws,
    '@/lib/utils/imageOptimization': {}, '@/lib/utils/videoOptimization': {},
  })
  const res = await route.DELETE(request('/api/upload', { s3Key: 'user-uploads/member-a/photo.png' }, 'DELETE'))
  assert.equal(res.status, who ? 200 : 401)
  const foreign = await route.DELETE(request('/api/upload', { s3Key: 'user-uploads/victim/photo.png' }, 'DELETE'))
  assert.equal(foreign.status, who ? 403 : 401)
  if (!who) {
    const post = await route.POST(request('/api/upload', {})); assert.equal(post.status, 401)
    assert.equal(awsCalls, 0)
  } else assert.equal(awsCalls, 1)
})

for (const granted of [false,true]) test(`debug inbox authorization: ${granted}`, async () => {
  let reads = 0
  const db = { from() { reads++; return { select() { return this }, eq() { return this }, order() { return this }, limit: async () => ({ data: [] }) } } }
  const route = load('src/app/api/debug/imap-emails/route.ts', {
    '@/lib/supabase/admin': { verifyAdminAccess: async () => granted ? { user } : { error: 'Unauthorized', status: 401 }, createAdminClient: () => db },
  })
  const res = await route.GET()
  assert.equal(res.status, granted ? 200 : 401)
  assert.equal(reads, granted ? 1 : 0)
})

for (const granted of [false,true]) test(`backup GET/POST authorization: ${granted}`, async () => {
  let awsCalls = 0
  const aws = { S3Client: class { async send() { awsCalls++; return {} } } }
  for (const name of ['ListObjectsV2Command','CopyObjectCommand','HeadBucketCommand']) aws[name] = class {}
  const route = load('src/app/api/backup/route.ts', {
    '@/lib/supabase/admin': { verifyAdminAccess: async () => granted ? { user } : { error: 'Unauthorized', status: 401 } },
    '@aws-sdk/client-s3': aws,
  })
  for (const method of ['GET','POST']) {
    const res = await route[method](request('/api/backup'))
    assert.equal(res.status, granted ? 200 : 401)
  }
  assert.equal(awsCalls > 0, granted)
})

test('media redirects are revalidated before resolving or connecting to a private destination', async () => {
  const { PassThrough } = require('node:stream')
  const { EventEmitter } = require('node:events')
  const lookedUp = []
  const helper = load('src/lib/security/media-fetch.ts', {
    'node:dns/promises': { lookup: async host => { lookedUp.push(host); return [{ address: '8.8.8.8', family: 4 }] } },
    'node:https': { request: (_url, options, callback) => {
      options.lookup('fal.media', { all: true }, (error, addresses) => { assert.equal(error, null); assert.deepEqual(addresses, [{ address: '8.8.8.8', family: 4 }]) })
      const req = new EventEmitter(); req.end = () => { const res = new PassThrough(); res.statusCode = 302; res.headers = { location: 'http://169.254.169.254/latest/meta-data/' }; callback(res) }; return req
    } },
  })
  await assert.rejects(helper.fetchMedia('https://fal.media/start'), /not allowed/)
  assert.deepEqual(lookedUp, ['fal.media'])
})

for (const kind of ['images','media']) test(`${kind} proxy makes hostile upstream HTML inert while preserving download bytes`, async () => {
  const html = '<script>alert(document.cookie)</script>'
  const route = load(`src/app/api/${kind}/proxy/route.ts`, {
    '@/lib/security/media-fetch': { ...media, fetchMedia: async () => new Response(html, { headers: { 'content-type': 'text/html' } }) },
  })
  const response = await route.GET(request(`/api/${kind}/proxy?url=${encodeURIComponent('https://fal.media/payload.html')}`))
  assert.equal(response.headers.get('content-disposition'), 'attachment')
  assert.match(response.headers.get('content-security-policy'), /sandbox; default-src 'none'/)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(await response.text(), html)
})

// Nearby onboarding and billing calculations should retain their established behavior.
for (const file of ['src/lib/activation/intake-markers.test.ts', 'src/lib/intensive/unlock-scoring.test.ts', 'src/lib/partners/math.test.ts']) load(file)

test('legacy member image upload preserves optimization and safe object naming', async () => {
  const before = [process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY]
  process.env.AWS_ACCESS_KEY_ID = 'local-test-key'; process.env.AWS_SECRET_ACCESS_KEY = 'local-test-secret'
  try {
    const writes = []
    const aws = { S3Client: class { async send(cmd) { if (cmd.input?.Key) writes.push(cmd.input); return { Buckets: [{ Name: 'vibration-fit-client-storage' }] } } } }
    for (const name of ['PutObjectCommand','DeleteObjectCommand','CreateMultipartUploadCommand','UploadPartCommand','CompleteMultipartUploadCommand','AbortMultipartUploadCommand','ListBucketsCommand']) aws[name] = class { constructor(input) { this.input = input } }
    const route = load('src/app/api/upload/route.ts', {
      '@/lib/security/storage-access': { storageActor: async () => ({ user }), storageKeyAllowed: async (_, key) => policy.canAccessStorageKey(key, user.id) },
      '@aws-sdk/client-s3': aws,
      '@/lib/utils/videoOptimization': {},
      '@/lib/utils/imageOptimization': { shouldOptimizeImage: () => true, getOptimalDimensions: () => ({}), optimizeImage: async () => ({ buffer: Buffer.from('webp'), contentType: 'image/webp', originalSize: 8, optimizedSize: 4, compressionRatio: 50 }) },
    })
    const form = new FormData(); form.set('file', new File(['original'], 'My Photo.png', { type: 'image/png' })); form.set('folder','journal/nested'); form.set('userId',user.id)
    const res = await route.POST({ formData: async () => form })
    assert.equal(res.status, 200)
    const result = await res.json()
    assert.match(result.key, /^user-uploads\/member-a\/journal\/nested\/.+-my-photo-optimized\.webp$/)
    assert.equal(writes.length, 1)
    assert.equal(writes[0].ContentType, 'image/webp')
    form.set('userId','victim')
    assert.equal((await route.POST({ formData: async () => form })).status, 403)
    assert.equal(writes.length, 1)
  } finally {
    for (const [key,value] of [['AWS_ACCESS_KEY_ID',before[0]],['AWS_SECRET_ACCESS_KEY',before[1]]]) value === undefined ? delete process.env[key] : process.env[key] = value
  }
})

for (const own of [true,false]) test(`gallery deletion retains ownership and direct server deletion: ${own}`, async () => {
  let deletes = 0
  const db = { auth: { getUser: async () => ({ data: { user } }) }, from() { return { select() { return this }, eq() { return this }, single: async () => ({ data: { id: 'image', user_id: own ? user.id : 'victim', s3_key: `user-uploads/${own ? user.id : 'victim'}/image.png` } }), delete() { return { eq: async () => ({ error: null }) } } } } }
  const route = load('src/app/api/gallery/generated/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@aws-sdk/client-s3': { S3Client: class { async send() { deletes++ } }, DeleteObjectCommand: class {} },
  })
  const res = await route.DELETE(new Request('https://app.example/api/gallery/generated?id=image', { method: 'DELETE' }))
  assert.equal(res.status, own ? 200 : 403)
  assert.equal(deletes, own ? 1 : 0)
})
