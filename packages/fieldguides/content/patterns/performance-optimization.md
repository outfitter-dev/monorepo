---
slug: performance-optimization
title: Optimize React app performance for speed and efficiency
description: Bundle size reduction and runtime performance patterns.
type: pattern
---

# Performance Optimization

Patterns for optimizing React application performance through bundle size reduction, efficient rendering, and strategic loading.

## Related Documentation

- [React Patterns](./react-patterns.md) - Core React patterns
- [React Component Standards](../standards/react-component-standards.md) - Component design
- [Next.js Patterns](./nextjs-patterns.md) - Framework-specific optimizations
- [Testing React Components](./testing-react-components.md) - Performance testing

## Bundle Size Optimization

### Tree Shaking

```typescript
// Bad: Imports entire library
import * as _ from 'lodash';
const result = _.debounce(fn, 300);

// Good: Import only what you need
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// Better: Use modern alternatives
import { debounce } from 'es-toolkit';
const result = debounce(fn, 300);
```

### Dynamic Imports

```typescript
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // or your error boundary component

// Lazy load heavy components
const ChartComponent = lazy(() =>
  import('./components/Chart')
  .then(module => ({ default: module.Chart }))
);

// With error boundary
function DashboardSection() {
  return (
    <ErrorBoundary fallback={<div>Failed to load chart</div>}>
      <Suspense fallback={<ChartSkeleton />}>
        <ChartComponent data={data} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Bundle Analysis

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "bundle-size": "size-limit"
  },
  "size-limit": [
    {
      "path": ".next/static/chunks/main-*.js",
      "limit": "150 KB"
    },
    {
      "path": ".next/static/chunks/pages/index-*.js",
      "limit": "80 KB"
    }
  ]
}
```

## Code Splitting Strategies

### Route-Based Splitting

```typescript
// app/routes.tsx
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />, // Small, load immediately
      },
      {
        path: 'dashboard',
        element: lazy(() => import('./pages/Dashboard')),
      },
      {
        path: 'analytics',
        element: lazy(() => import('./pages/Analytics')),
      },
    ],
  },
];
```

### Component-Level Splitting

```typescript
// components/DataTable.tsx
import { lazy, useState } from 'react';

const ExportModal = lazy(() =>
  import('./ExportModal').then(m => ({ default: m.ExportModal }))
);

export function DataTable({ data }: DataTableProps) {
  const [showExport, setShowExport] = useState(false);

  return (
    <>
      <table>{/* Table content */}</table>
      <button onClick={() => setShowExport(true)}>Export</button>

      {showExport && (
        <Suspense fallback={<LoadingModal />}>
          <ExportModal
            data={data}
            onClose={() => setShowExport(false)}
          />
        </Suspense>
      )}
    </>
  );
}
```

## React.memo and useMemo Patterns

### Strategic Memoization

```typescript
import { memo } from 'react';

// Only memoize expensive components
interface ExpensiveListProps {
  items: Item[];
  onItemClick: (id: string) => void;
}

export const ExpensiveList = memo(({ items, onItemClick }: ExpensiveListProps) => {
  return (
    <VirtualList
      items={items}
      renderItem={(item) => (
        <ExpensiveItem
          key={item.id}
          item={item}
          onClick={onItemClick}
        />
      )}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.items.length === nextProps.items.length &&
    prevProps.items.every((item, index) =>
      item.id === nextProps.items[index].id &&
      item.updatedAt === nextProps.items[index].updatedAt
    )
  );
});
```

### useMemo for Expensive Calculations

```typescript
import { useMemo } from 'react';

function DataAnalysis({ rawData }: { rawData: number[] }) {
  // Only recalculate when rawData changes
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');
    return {
      mean: calculateMean(rawData),
      median: calculateMedian(rawData),
      standardDev: calculateStandardDeviation(rawData),
      percentiles: calculatePercentiles(rawData),
    };
  }, [rawData]);

  // Don't memoize simple calculations
  const total = rawData.length; // This is cheap, no memo needed

  return <StatsDisplay stats={statistics} total={total} />;
}
```

## Virtual Scrolling

### Large List Optimization

```typescript
import { FixedSizeList } from 'react-window';

interface VirtualTableProps {
  data: Record<string, any>[];
  columns: Column[];
}

export function VirtualTable({ data, columns }: VirtualTableProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex">
      {columns.map(col => (
        <div key={col.key} className="flex-1 px-4">
          {data[index][col.key]}
        </div>
      ))}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={data.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Image Optimization

### Lazy Loading Images

```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  return (
    <picture>
      <source
        srcSet={`${src}?w=${width}&f=webp`}
        type="image/webp"
      />
      <source
        srcSet={`${src}?w=${width}&f=jpg`}
        type="image/jpeg"
      />
      <img
        src={`${src}?w=${width}&f=jpg`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}
```

### Responsive Images

```typescript
function ResponsiveHero({ image }: { image: ImageData }) {
  return (
    <picture>
      <source
        media="(max-width: 640px)"
        srcSet={`${image.url}?w=640&h=400&fit=cover`}
      />
      <source
        media="(max-width: 1024px)"
        srcSet={`${image.url}?w=1024&h=600&fit=cover`}
      />
      <img
        src={`${image.url}?w=1920&h=1080&fit=cover`}
        alt={image.alt}
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}
```

## Runtime Performance Monitoring

### Performance Observer

```typescript
// hooks/usePerformanceMonitor.ts
import { useEffect, useCallback } from 'react';

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`[${componentName}] ${entry.name}: ${entry.duration}ms`);

          // Send to analytics if needed
          if (entry.duration > 100) {
            analytics.track('slow_render', {
              component: componentName,
              duration: entry.duration,
              name: entry.name,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, [componentName]);

  const measureRender = useCallback(
    (operation: string) => {
      const startMark = `${componentName}-${operation}-start`;
      const endMark = `${componentName}-${operation}-end`;
      const measureName = `${componentName}-${operation}`;

      performance.mark(startMark);

      return () => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
      };
    },
    [componentName]
  );

  return { measureRender };
}
```

### React DevTools Profiler

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) {
  // Log slow renders
  if (actualDuration > 16) { // Slower than 60fps
    console.warn(`Slow render in ${id}:`, {
      phase,
      actualDuration,
      baseDuration,
    });
  }
}

export function ProfiledApp() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <App />
    </Profiler>
  );
}
```

## When to Optimize

### Measure First

1. Use browser DevTools Performance tab
2. Monitor Core Web Vitals (LCP, FID, CLS)
3. Set performance budgets
4. Profile before optimizing

### Optimization Checklist

- [ ] Bundle size under 200KB (gzipped)
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] No memory leaks in long-running sessions
- [ ] Smooth scrolling (60fps)
- [ ] Efficient re-renders (React DevTools)

### Common Pitfalls

1. **Over-memoization**: Don't memo everything
2. **Premature optimization**: Measure first
3. **Ignoring network**: Optimize API calls too
4. **Missing fonts**: Preload critical fonts
5. **Unoptimized images**: Use proper formats and sizes
