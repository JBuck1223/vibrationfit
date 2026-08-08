'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { geoNaturalEarth1, geoPath, type GeoSphere } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

type CountryFeature = Feature<Geometry, { name?: string }>
import { Spinner } from '@/lib/design-system/components'
import { countryNumeric } from '@/lib/travel/countries'

const WIDTH = 960
const HEIGHT = 500

const VISITED_FILL = 'rgba(57, 255, 20, 0.55)'
const DREAM_FILL = 'rgba(191, 0, 255, 0.5)'
const BOTH_FILL = 'rgba(0, 255, 255, 0.55)'
const EMPTY_FILL = '#262626'

interface WorldMapProps {
  /** ISO alpha-2 codes of countries with taken/upcoming trips */
  visitedCountryCodes: string[]
  /** ISO alpha-2 codes of dream destinations */
  dreamCountryCodes?: string[]
}

async function fetchWorldTopology(): Promise<Topology> {
  const res = await fetch('/data/world-110m.json')
  if (!res.ok) throw new Error('Failed to load world map data')
  return res.json()
}

export function WorldMap({ visitedCountryCodes, dreamCountryCodes = [] }: WorldMapProps) {
  const { data: topology, isLoading } = useQuery({
    queryKey: ['world-topology'],
    queryFn: fetchWorldTopology,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const visitedNumeric = useMemo(
    () => new Set(visitedCountryCodes.map((c) => countryNumeric(c)).filter(Boolean) as string[]),
    [visitedCountryCodes]
  )
  const dreamNumeric = useMemo(
    () => new Set(dreamCountryCodes.map((c) => countryNumeric(c)).filter(Boolean) as string[]),
    [dreamCountryCodes]
  )

  const { features, pathFor } = useMemo(() => {
    if (!topology) {
      return {
        features: [] as CountryFeature[],
        pathFor: null as ((f: CountryFeature) => string | null) | null,
      }
    }
    const collection = feature(
      topology,
      topology.objects.countries as GeometryCollection
    ) as unknown as FeatureCollection<Geometry, { name?: string }>
    const sphere: GeoSphere = { type: 'Sphere' }
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], sphere)
    const path = geoPath(projection)
    return {
      features: collection.features,
      pathFor: (f: CountryFeature) => path(f),
    }
  }, [topology])

  if (isLoading || !topology || !pathFor) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="World map of places visited and dream destinations"
      >
        {features.map((f) => {
          const id = String(f.id ?? '').padStart(3, '0')
          const visited = visitedNumeric.has(id)
          const dream = dreamNumeric.has(id)
          const fill = visited && dream ? BOTH_FILL : visited ? VISITED_FILL : dream ? DREAM_FILL : EMPTY_FILL
          const d = pathFor(f)
          if (!d) return null
          return (
            <path
              key={id + (f.properties?.name || '')}
              d={d}
              fill={fill}
              stroke="#0a0a0a"
              strokeWidth={0.5}
              className="transition-opacity hover:opacity-80"
            >
              <title>{f.properties?.name || 'Unknown'}</title>
            </path>
          )
        })}
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: VISITED_FILL }} />
          Visited
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: DREAM_FILL }} />
          Dream List
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: BOTH_FILL }} />
          Visited & Dreaming of Return
        </span>
      </div>
    </div>
  )
}
