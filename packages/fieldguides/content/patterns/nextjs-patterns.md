---
slug: nextjs-patterns
title: Build Next.js apps with App Router and server components
description: Server-side rendering, routing, and deployment patterns for Next.js.
type: guide
---

# Next.js Patterns

Server-side rendering, routing, and deployment patterns for Next.js 15
applications with App Router, Server Components, and modern features.

## Related Documentation

- [React Patterns](./react-patterns.md) - Modern React patterns
- [TypeScript Standards](../standards/typescript-standards.md) - Type-safe
  Next.js
- [Performance Optimization](./performance-optimization.md) - Next.js
  performance
- [Deployment Standards](../standards/deployment-standards.md) - Deployment best
  practices

## App Router Patterns

### Layout Architecture with Parallel Routes

```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App'
  },
  description: 'Modern Next.js application',
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        {modal}
        <Footer />
      </body>
    </html>
  );
}

// app/@modal/(.)photos/[id]/page.tsx - Intercepting route for modals
export default function PhotoModal({ params }: { params: { id: string } }) {
  return (
    <Modal>
      <PhotoDetails id={params.id} />
    </Modal>
  );
}

// app/(dashboard)/layout.tsx - Route group with metadata
export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardLayout({
  children,
  analytics,
  metrics,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  metrics: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        {children}
        <div className="dashboard-widgets">
          {analytics}
          {metrics}
        </div>
      </div>
    </div>
  );
}
```

### Server Components with Streaming

```typescript
// app/users/page.tsx
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';

// Cache function with tags for revalidation
const getCachedUsers = unstable_cache(
  async () => {
    const res = await fetch('https://api.example.com/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },
  ['users-list'],
  {
    revalidate: 3600,
    tags: ['users'],
  }
);

export default async function UsersPage() {
  return (
    <div>
      <h1>Users</h1>
      <Suspense fallback={<UsersSkeleton />}>
        <UsersList promise={getCachedUsers()} />
      </Suspense>
    </div>
  );
}

// Streaming component
async function UsersList({ promise }: { promise: Promise<User[]> }) {
  const users = await promise;

  return (
    <div className="grid">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Partial Prerendering (PPR)

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Static shell - prerendered
export default function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <h1>Dashboard</h1>

      {/* Dynamic content with loading states */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <DynamicChart />
      </Suspense>
    </div>
  );
}

// Dynamic content - rendered on demand
async function DashboardStats() {
  const stats = await fetchStats();
  return <StatsGrid stats={stats} />;
}

const DynamicChart = dynamic(() => import('./Chart'), {
  loading: () => <ChartSkeleton />,
});
```

### Client Components

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

## Data Fetching

### Modern Server Actions with Type Safety

```typescript
// app/actions/user.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';

// Type-safe server action with next-safe-action
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
});

export const createUser = actionClient
  .schema(schema)
  .action(async ({ parsedInput: { name, email } }) => {
    try {
      const user = await db.user.create({
        data: { name, email },
      });

      revalidateTag('users');
      revalidatePath('/users');

      return { success: true, user };
    } catch (error) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'Email already exists',
        };
      }
      throw error; // Let error boundary handle unexpected errors
    }
  });

// Server action with optimistic updates
export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive'
) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { status },
    });

    revalidateTag(`user:${userId}`);
  } catch (error) {
    throw new Error('Failed to update user status');
  }
}

// Server action with redirect
export async function deleteUserAndRedirect(userId: string) {
  try {
    await db.user.delete({ where: { id: userId } });
    revalidateTag('users');
  } catch (error) {
    throw new Error('Failed to delete user');
  }

  redirect('/users');
}
```

### Data Loading Patterns

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { cache } from 'react';

// Request deduplication with cache
const getProduct = cache(async (id: string) => {
  const product = await db.product.findUnique({
    where: { id },
    include: { reviews: true },
  });

  if (!product) notFound();
  return product;
});

// Generate metadata
export async function generateMetadata({
  params
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}

// Page component
export default async function ProductPage({
  params
}: {
  params: { id: string }
}) {
  // Same request is deduped
  const product = await getProduct(params.id);

  return (
    <>
      <ProductDetails product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews productId={product.id} />
      </Suspense>
    </>
  );
}

// Streaming reviews separately
async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await fetchReviews(productId);
  return <ReviewsList reviews={reviews} />;
}
```

## Modern API Patterns

### Route Handlers with Streaming

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation
const querySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // Type-safe query parsing
  const { searchParams } = request.nextUrl;
  const result = querySchema.safeParse({
    q: searchParams.get('q'),
    limit: searchParams.get('limit'),
    cursor: searchParams.get('cursor'),
  });

  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { q, limit, cursor } = result.data;

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, -1) : users;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}

// Streaming response
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const data = await request.json();

        // Start processing
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: 'processing' })}\n\n`
          )
        );

        // Simulate long-running operation
        const result = await processUserData(data);

        // Send result
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ status: 'complete', result })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

### Advanced Middleware Patterns

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Performance monitoring
  const start = Date.now();

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  // Authentication check
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifyAuth(token);
      // Add user info to headers for server components
      response.headers.set('x-user-id', payload.userId);
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Rate limiting
  const ip = request.ip ?? '127.0.0.1';
  const rateLimit = await checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': rateLimit.retryAfter.toString(),
      },
    });
  }

  // Add performance header
  response.headers.set('Server-Timing', `middleware;dur=${Date.now() - start}`);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Modern Configuration

### Type-Safe Environment Variables

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Server-side environment variables
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  SECRET_KEY: z.string().min(32),

  // Client-side environment variables
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

// Validate environment variables at build time
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

// Type-safe usage throughout the app
// import { env } from '@/lib/env';
// console.log(env.DATABASE_URL); // TypeScript knows this exists

// next.config.mjs
import { env } from './lib/env.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable Partial Prerendering
    ppr: true,
    // React compiler
    reactCompiler: true,
    // Better error handling
    typedRoutes: true,
  },

  // Strict mode for better debugging
  reactStrictMode: true,

  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        })
      );
    }
    return config;
  },
};

export default nextConfig;
```

### Modern Image Handling

```typescript
// next.config.mjs
export default {
  images: {
    // Use pattern matching for remote images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Modern formats
    formats: ['image/avif', 'image/webp'],
    // Cloudinary or similar loader
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
};

// lib/image-loader.ts
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(',')}${src}`;
}

// components/OptimizedImage.tsx
import Image from 'next/image';
import { getPlaiceholder } from 'plaiceholder';

interface OptimizedImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export async function OptimizedImage({ src, alt, priority }: OptimizedImageProps) {
  // Generate blur placeholder at build time
  const { base64, img } = await getPlaiceholder(src);

  return (
    <Image
      {...img}
      src={src}
      alt={alt}
      priority={priority}
      placeholder="blur"
      blurDataURL={base64}
      sizes="(max-width: 768px) 100vw,
             (max-width: 1200px) 50vw,
             33vw"
      style={{
        objectFit: 'cover',
        width: '100%',
        height: 'auto',
      }}
    />
  );
}
```

## Error Handling

### Error Boundaries

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Not Found Pages

```typescript
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}

// Trigger programmatically
import { notFound } from 'next/navigation';

async function UserProfile({ id }: { id: string }) {
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return <Profile user={user} />;
}
```

## Authentication with NextAuth v5

### Modern Session Management

```typescript
// auth.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import GitHub from 'next-auth/providers/github';
import { db } from '@/lib/db';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add custom fields to session
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

// app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@/auth';

// Protected server component
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <Dashboard user={session.user} />;
}

// Protected API route
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Your protected logic here
}
```

## Performance Optimization

### ISR with On-Demand Revalidation

```typescript
// app/blog/[slug]/page.tsx
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';

// Cache with on-demand revalidation
const getPost = unstable_cache(
  async (slug: string) => {
    const post = await db.post.findUnique({
      where: { slug },
      include: { author: true },
    });
    return post;
  },
  ['post-by-slug'],
  {
    tags: ['posts'],
    revalidate: 3600,
  }
);

// Generate static params at build time
export async function generateStaticParams() {
  const posts = await db.post.findMany({
    select: { slug: true },
    orderBy: { createdAt: 'desc' },
    take: 100, // Pre-build top 100 posts
  });

  return posts.map(post => ({
    slug: post.slug,
  }));
}

// On-demand revalidation webhook
// app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const { type, slug, secret } = await request.json();

  // Verify webhook secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    if (type === 'post') {
      revalidateTag('posts');
      revalidatePath(`/blog/${slug}`);
    }

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json(
      { message: 'Error revalidating' },
      { status: 500 }
    );
  }
}
```

### Advanced Performance Patterns

```typescript
// Optimize client bundle with server-only
import 'server-only';
import { cache } from 'react';

// This will throw an error if accidentally imported in client code
export const serverOnlyFunction = cache(async () => {
  // Server-only logic
});

// components/ClientBoundary.tsx
'use client';

import dynamic from 'next/dynamic';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Lazy load heavy components on viewport entry
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
});

export function LazyChart() {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  return (
    <div ref={ref} style={{ minHeight: 400 }}>
      {isIntersecting && <HeavyChart />}
    </div>
  );
}

// Resource hints for critical resources
export function ResourceHints() {
  return (
    <Head>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="dns-prefetch"
        href="https://api.example.com"
      />
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </Head>
  );
}
```

## Modern Deployment Patterns

### Edge Runtime and Serverless

```typescript
// app/api/edge/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Use Edge Runtime
export const preferredRegion = 'iad1'; // Deploy close to your data

export async function GET(request: NextRequest) {
  // Edge runtime has ~1ms cold start vs ~100ms for Node.js
  const data = await fetch('https://api.example.com/data');

  return Response.json(await data.json(), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
    },
  });
}

// next.config.mjs - Production configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
];

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

export default {
  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Output configuration
  output: 'standalone',

  // Experimental features for production
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components/ui'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,
      },
    ];
  },
};
```

## Monitoring and Analytics

### Web Vitals Tracking

```typescript
// app/components/Analytics.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function Analytics() {
  const pathname = usePathname();

  // Track page views
  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: pathname,
      });
    }
  }, [pathname]);

  // Track Core Web Vitals
  useReportWebVitals(metric => {
    // Send to your analytics service
    const body = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    // Example: Send to custom endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/vitals', {
        method: 'POST',
        body: JSON.stringify(body),
        keepalive: true,
      });
    }
  });

  return null;
}
```

## Best Practices Summary

1. **Use App Router**: Leverage Server Components for better performance
2. **Stream Everything**: Use Suspense boundaries for progressive rendering
3. **Type Everything**: Use TypeScript with strict mode and type-safe APIs
4. **Cache Smartly**: Use unstable_cache with proper tags for invalidation
5. **Optimize Images**: Use next/image with modern formats and responsive sizing
6. **Secure by Default**: Implement proper CSP and security headers
7. **Monitor Performance**: Track Web Vitals and user interactions
8. **Use Edge When Possible**: Deploy compute-light APIs to the edge
