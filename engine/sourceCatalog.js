// Catálogo inicial de fuentes reales (feeds RSS públicos de cada medio).
// La fiabilidad NO se inventa: queda null y se marca 'reliability:provisional' hasta tener metodología.
// Las URL de feed deben verificarse desde el backend (los medios las cambian sin aviso).
const RAW = [
  ['BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'GB', 'en', 'broadcast'],
  ['The Guardian', 'https://www.theguardian.com', 'https://www.theguardian.com/world/rss', 'GB', 'en', 'newspaper'],
  ['NPR', 'https://www.npr.org', 'https://feeds.npr.org/1001/rss.xml', 'US', 'en', 'broadcast'],
  ['Al Jazeera', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'QA', 'en', 'broadcast'],
  ['El País', 'https://elpais.com', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', 'ES', 'es', 'newspaper'],
  ['RTVE', 'https://www.rtve.es', 'https://api2.rtve.es/rss/temas_noticias.xml', 'ES', 'es', 'broadcast'],
  ['elDiario.es', 'https://www.eldiario.es', 'https://www.eldiario.es/rss/', 'ES', 'es', 'newspaper'],
  ['Europa Press', 'https://www.europapress.es', 'https://www.europapress.es/rss/rss.aspx', 'ES', 'es', 'agency'],
  ['DW Español', 'https://www.dw.com/es', 'https://rss.dw.com/rdf/rss-sp-all', 'DE', 'es', 'broadcast'],
  ['France 24 Español', 'https://www.france24.com/es', 'https://www.france24.com/es/rss', 'FR', 'es', 'broadcast'],
  ['Le Monde', 'https://www.lemonde.fr', 'https://www.lemonde.fr/rss/une.xml', 'FR', 'fr', 'newspaper'],
  ['Público', 'https://www.publico.pt', 'https://www.publico.pt/rss', 'PT', 'pt', 'newspaper'],
]

export const REAL_SOURCES = RAW.map(([name, url, feed_url, country, language, type]) => ({
  name, url, feed_url, country, language, type,
  reliability: null,
  reliability_score: null,
  bias_profile: 'reliability:provisional',
  category: null,
  is_active: true,
  is_demo: false,
}))
