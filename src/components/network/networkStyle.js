/** Color por tipo de entidad (paleta de gráficos validada; tipos poco frecuentes en gris). */
export const TYPE_COLOR = {
  person: 'var(--viz-1)',
  organization: 'var(--viz-2)',
  institution: 'var(--viz-2)',
  government: 'var(--viz-2)',
  political_party: 'var(--viz-2)',
  company: 'var(--viz-3)',
  country: 'var(--viz-4)',
  city: 'var(--viz-4)',
  location: 'var(--viz-4)',
  sports_team: 'var(--viz-5)',
  sports_event: 'var(--viz-5)',
  other: 'hsl(var(--muted-foreground))',
}

/** Grupos de la leyenda (cinco familias, cada una con su color fijo). */
export const TYPE_GROUPS = [
  ['person', ['person']],
  ['organization', ['organization', 'institution', 'government', 'political_party']],
  ['company', ['company']],
  ['location', ['country', 'city', 'location']],
  ['sports_team', ['sports_team', 'sports_event']],
]
