declare const self: ServiceWorkerGlobalScope

self.addEventListener('error', event =>
  console.error('Service Worker: Uncaught error:', event.error)
)
self.addEventListener('install', event => event.waitUntil(handleInstall()))
self.addEventListener('activate', event => event.waitUntil(handleActivate()))
self.addEventListener('message', handleMessage)
self.addEventListener('fetch', handleFetch)
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection:', event.reason)
  event.preventDefault()
})
// Periodic sync for updating cache (if supported)
self.addEventListener('sync', event => {
  const syncEvent = event as SyncEvent
  syncEvent.waitUntil(handleBackgroundSync(syncEvent.tag))
})

// Define SyncEvent interface since it's not in standard types
interface SyncEvent extends ExtendableEvent {
  tag: string
}

const CACHE_VERSION = 'v0'
const CACHE_NAME = `bitcoin-message-verifier-${CACHE_VERSION}`
const STATIC_CACHE_NAME = `bitcoin-message-verifier-static-${CACHE_VERSION}`
const BASE_PATH = self.location.pathname.replace('/sw.js', '') || ''
const STATIC_FILES = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/demo.js`,
  `${BASE_PATH}/verify.js`,
  `${BASE_PATH}/css/pico.min.css`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.svg`,
]

function isCacheableResource(url: URL) {
  return (
    url.pathname.includes('.js') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.json') ||
    url.pathname.includes('.html') ||
    url.pathname.includes('.svg') ||
    url.pathname === BASE_PATH + '/' ||
    url.pathname === BASE_PATH
  )
}

function getCurrentCacheNames() {
  return [STATIC_CACHE_NAME, CACHE_NAME]
}

// Install event - cache static files with async/await
async function handleInstall() {
  console.log('Service Worker: Installing...')

  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    console.log('Service Worker: Caching static files')

    await cache.addAll(STATIC_FILES)
    console.log('Service Worker: Static files cached successfully')

    await self.skipWaiting()
    console.log('Service Worker: Skip waiting completed')
  } catch (error) {
    console.error('Service Worker: Failed to cache static files', error)
    throw error // Re-throw to ensure proper error handling
  }
}

// Activate event - clean up old caches with async/await
async function handleActivate(): Promise<void> {
  console.log('Service Worker: Activating...')

  try {
    const cacheNames = await caches.keys()

    // Clean up old caches
    const currentCacheNames = getCurrentCacheNames()
    const deletePromises = cacheNames
      .filter(cacheName => !currentCacheNames.includes(cacheName))
      .map(async cacheName => {
        console.log('Service Worker: Deleting old cache', cacheName)
        return await caches.delete(cacheName)
      })

    await Promise.all(deletePromises)
    console.log('Service Worker: Old caches cleaned up')

    await self.clients.claim()
    console.log('Service Worker: Activated successfully')
  } catch (error) {
    console.error('Service Worker: Activation failed', error)
    throw error
  }
}

// Fetch event handler with async/await
async function handleFetchAsync(request: Request): Promise<Response> {
  const url = new URL(request.url)

  try {
    // Check cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache', request.url)
      return cachedResponse
    }

    // Fetch from network
    const response = await fetch(request)

    // Don't cache non-successful responses
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response
    }

    // Clone the response since it can only be consumed once
    const responseToCache = response.clone()

    // Cache the response for future use (only cache app resources)
    if (isCacheableResource(url)) {
      // Cache asynchronously without blocking the response
      cacheResource(request, responseToCache)
    }

    return response
  } catch (error) {
    console.error('Service Worker: Fetch failed', error)

    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const fallbackResponse =
        (await caches.match(`${BASE_PATH}/index.html`)) ||
        (await caches.match(`${BASE_PATH}/`)) ||
        (await caches.match('/index.html'))

      if (fallbackResponse) {
        return fallbackResponse
      }
    }

    throw error
  }
}

// Helper function to cache resources asynchronously
async function cacheResource(request: Request, response: Response): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME)
    console.log('Service Worker: Caching new resource', request.url)
    await cache.put(request, response)
  } catch (error) {
    console.error('Service Worker: Failed to cache resource', error)
  }
}

// Fetch event - serve from cache when offline and handle file sharing
function handleFetch(event: FetchEvent) {
  const url = new URL(event.request.url)

  // Handle shared files first
  if (url.pathname === BASE_PATH && event.request.method === 'POST') {
    event.respondWith(handleSharedFiles(event.request))
    return
  }

  // Only handle GET requests for caching
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(handleFetchAsync(event.request))
}

// Message handler with async/await
async function handleMessageAsync(event: ExtendableMessageEvent): Promise<void> {
  if (!event.data) {
    return
  }

  try {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        console.log('Service Worker: Received SKIP_WAITING message')
        await self.skipWaiting()
        break

      case 'TRACK_USAGE_TIME':
        console.log('Service Worker: Tracking usage time')
        const startTime = Date.now()
        event.ports[0]?.postMessage({ type: 'USAGE_TRACKED', startTime })
        break

      default:
        console.log('Service Worker: Unknown message type:', event.data.type)
    }
  } catch (error) {
    console.error('Service Worker: Error handling message:', error)
  }
}

function handleMessage(event: ExtendableMessageEvent) {
  // For message handling, we don't need to use waitUntil unless we have async operations
  // that need to complete before the service worker can be terminated
  switch (event.data?.type) {
    case 'SKIP_WAITING':
    case 'TRACK_USAGE_TIME':
      event.waitUntil(handleMessageAsync(event))
      break

    default:
      void handleMessage(event)
      break
  }
}

// Background sync handler with async/await
async function handleBackgroundSync(tag: string) {
  if (tag !== 'background-sync') {
    return
  }

  try {
    console.log('Service Worker: Starting background sync')
    const cache = await caches.open(STATIC_CACHE_NAME)

    // Update critical files in the background
    const criticalFiles = [
      `${BASE_PATH}/payloads.json`, // Update the payloads file
      `${BASE_PATH}/demo.js`, // Update the demo script
      `${BASE_PATH}/verify.js`, // Update the verify script
    ]

    await cache.addAll(criticalFiles)
    console.log('Service Worker: Background sync completed successfully')
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
    throw error
  }
}

async function handleSharedFiles(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return Response.redirect(`${BASE_PATH}/`)
    }

    const file = files[0]
    const text = await file.text()

    // Try to parse as JSON first
    try {
      const data = JSON.parse(text)
      if (data.address && data.message && data.signature) {
        const params = new URLSearchParams({
          address: data.address,
          message: data.message,
          signature: data.signature,
        })
        return Response.redirect(`${BASE_PATH}/?${params.toString()}`)
      }
    } catch {
      // Not JSON, treat as plain text message
      const params = new URLSearchParams({
        message: text,
      })
      return Response.redirect(`${BASE_PATH}/?${params.toString()}`)
    }

    return Response.redirect(`${BASE_PATH}/`)
  } catch (error) {
    console.error('Error handling shared files:', error)
    return Response.redirect(`${BASE_PATH}/`)
  }
}
