import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getCountryCoordinates } from '@/lib/countryCoordinates'
import { getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const HEAT = ['#f5c518', '#f07a10', '#c8102e']
function heat(w = 0) {
  const t = Math.max(0, Math.min(1, w))
  const [a, b] = t < 0.5 ? [HEAT[0], HEAT[1]] : [HEAT[1], HEAT[2]]
  const k = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5
  const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k)).join(',')})`
}

/** Vista 2D (Leaflet + teselas OpenStreetMap, con su atribución obligatoria). */
export default function WorldMap({ countries = [], selected, onSelect, className }) {
  const { t, locale } = useI18n()
  return (
    <div className={cn('world-map overflow-hidden rounded-2xl border', className)}>
      <MapContainer center={[25, 10]} zoom={2} minZoom={2} maxZoom={6} worldCopyJump scrollWheelZoom className="h-full w-full" style={{ background: 'hsl(var(--surface))' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {countries.map((c) => {
          const coords = getCountryCoordinates(c.code)
          if (!coords) return null
          const on = c.code === selected
          return (
            <CircleMarker
              key={c.code}
              center={coords}
              radius={6 + 14 * Math.sqrt(c.intensity)}
              pathOptions={{ color: heat(c.intensity), weight: on ? 3 : 1.5, fillOpacity: on ? 0.75 : 0.45 }}
              eventHandlers={{ click: () => onSelect?.(c.code) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {getCountryName(c.code, locale)} · {c.count === 1 ? t('world.countryStoriesOne') : t('world.countryStories', { count: c.count })}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
