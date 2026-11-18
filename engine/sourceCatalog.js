// Catálogo de fuentes reales por país (feeds RSS públicos de cada medio).
// Una "edición" de país muestra lo que publica la prensa de ese país y lo que ocurre en él.
// La fiabilidad NO se inventa: queda null y se marca 'reliability:provisional'.
// Las URL de feed se comprueban en cada ejecución de GitHub Actions (el registro muestra cuáles fallan).

// [nombre, web, feed, país, idioma, tipo]
const RAW = [
  // España
  ['El País', 'https://elpais.com', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', 'ES', 'es', 'newspaper'],
  ['El Mundo', 'https://www.elmundo.es', 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml', 'ES', 'es', 'newspaper'],
  ['ABC', 'https://www.abc.es', 'https://www.abc.es/rss/2.0/portada/', 'ES', 'es', 'newspaper'],
  ['La Vanguardia', 'https://www.lavanguardia.com', 'https://www.lavanguardia.com/rss/home.xml', 'ES', 'es', 'newspaper'],
  ['20minutos', 'https://www.20minutos.es', 'https://www.20minutos.es/rss/', 'ES', 'es', 'newspaper'],
  ['RTVE', 'https://www.rtve.es', 'https://api2.rtve.es/rss/temas_noticias.xml', 'ES', 'es', 'broadcast'],
  ['elDiario.es', 'https://www.eldiario.es', 'https://www.eldiario.es/rss/', 'ES', 'es', 'newspaper'],
  ['Europa Press', 'https://www.europapress.es', 'https://www.europapress.es/rss/rss.aspx', 'ES', 'es', 'agency'],
  // Estados Unidos
  ['The New York Times', 'https://www.nytimes.com', 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'US', 'en', 'newspaper'],
  ['NPR', 'https://www.npr.org', 'https://feeds.npr.org/1001/rss.xml', 'US', 'en', 'broadcast'],
  ['CBS News', 'https://www.cbsnews.com', 'https://www.cbsnews.com/latest/rss/main', 'US', 'en', 'broadcast'],
  ['Fox News', 'https://www.foxnews.com', 'https://moxie.foxnews.com/google-publisher/latest.xml', 'US', 'en', 'broadcast'],
  ['ABC News', 'https://abcnews.go.com', 'https://abcnews.go.com/abcnews/topstories', 'US', 'en', 'broadcast'],
  // Reino Unido
  ['BBC News', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/rss.xml', 'GB', 'en', 'broadcast'],
  ['BBC World', 'https://www.bbc.com/news/world', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'GB', 'en', 'broadcast'],
  ['The Guardian', 'https://www.theguardian.com', 'https://www.theguardian.com/uk/rss', 'GB', 'en', 'newspaper'],
  ['Sky News', 'https://news.sky.com', 'https://feeds.skynews.com/feeds/rss/home.xml', 'GB', 'en', 'broadcast'],
  ['The Independent', 'https://www.independent.co.uk', 'https://www.independent.co.uk/news/uk/rss', 'GB', 'en', 'newspaper'],
  // Francia
  ['Le Monde', 'https://www.lemonde.fr', 'https://www.lemonde.fr/rss/une.xml', 'FR', 'fr', 'newspaper'],
  ['Le Figaro', 'https://www.lefigaro.fr', 'https://www.lefigaro.fr/rss/figaro_actualites.xml', 'FR', 'fr', 'newspaper'],
  ['France 24', 'https://www.france24.com/fr', 'https://www.france24.com/fr/rss', 'FR', 'fr', 'broadcast'],
  ['France 24 Español', 'https://www.france24.com/es', 'https://www.france24.com/es/rss', 'FR', 'es', 'broadcast'],
  // México
  ['El Universal', 'https://www.eluniversal.com.mx', 'https://www.eluniversal.com.mx/arc/outboundfeeds/rss/?outputType=xml', 'MX', 'es', 'newspaper'],
  ['Excélsior', 'https://www.excelsior.com.mx', 'https://www.excelsior.com.mx/rss.xml', 'MX', 'es', 'newspaper'],
  ['El Financiero', 'https://www.elfinanciero.com.mx', 'https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/?outputType=xml', 'MX', 'es', 'newspaper'],
  // Argentina
  ['Clarín', 'https://www.clarin.com', 'https://www.clarin.com/rss/lo-ultimo/', 'AR', 'es', 'newspaper'],
  ['La Nación', 'https://www.lanacion.com.ar', 'https://www.lanacion.com.ar/arc/outboundfeeds/rss/?outputType=xml', 'AR', 'es', 'newspaper'],
  ['Infobae', 'https://www.infobae.com', 'https://www.infobae.com/arc/outboundfeeds/rss/', 'AR', 'es', 'newspaper'],
  // Alemania
  ['Tagesschau', 'https://www.tagesschau.de', 'https://www.tagesschau.de/xml/rss2/', 'DE', 'de', 'broadcast'],
  ['Der Spiegel', 'https://www.spiegel.de', 'https://www.spiegel.de/schlagzeilen/index.rss', 'DE', 'de', 'newspaper'],
  ['DW Español', 'https://www.dw.com/es', 'https://rss.dw.com/rdf/rss-sp-all', 'DE', 'es', 'broadcast'],
  // Colombia, Chile y Perú
  ['El Espectador', 'https://www.elespectador.com', 'https://www.elespectador.com/arc/outboundfeeds/rss/?outputType=xml', 'CO', 'es', 'newspaper'],
  ['La Tercera', 'https://www.latercera.com', 'https://www.latercera.com/arc/outboundfeeds/rss/?outputType=xml', 'CL', 'es', 'newspaper'],
  ['El Comercio', 'https://elcomercio.pe', 'https://elcomercio.pe/arc/outboundfeeds/rss/?outputType=xml', 'PE', 'es', 'newspaper'],
  // Canadá e Irlanda
  ['CBC News', 'https://www.cbc.ca/news', 'https://rss.cbc.ca/lineup/topstories.xml', 'CA', 'en', 'broadcast'],
  ['Global News', 'https://globalnews.ca', 'https://globalnews.ca/feed/', 'CA', 'en', 'broadcast'],
  ['RTÉ News', 'https://www.rte.ie/news', 'https://www.rte.ie/feeds/rss/?index=/news/', 'IE', 'en', 'broadcast'],
  // Italia
  ['ANSA English', 'https://www.ansa.it/english', 'https://www.ansa.it/english/news/english_nr_rss.xml', 'IT', 'en', 'agency'],
  // Ucrania e Israel
  ['The Kyiv Independent', 'https://kyivindependent.com', 'https://kyivindependent.com/news-archive/rss/', 'UA', 'en', 'newspaper'],
  ['The Times of Israel', 'https://www.timesofisrael.com', 'https://www.timesofisrael.com/feed/', 'IL', 'en', 'newspaper'],
  // Asia
  ['The Hindu', 'https://www.thehindu.com', 'https://www.thehindu.com/news/feeder/default.rss', 'IN', 'en', 'newspaper'],
  ['The Times of India', 'https://timesofindia.indiatimes.com', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'IN', 'en', 'newspaper'],
  ['The Japan Times', 'https://www.japantimes.co.jp', 'https://www.japantimes.co.jp/feed/', 'JP', 'en', 'newspaper'],
  ['Yonhap', 'https://en.yna.co.kr', 'https://en.yna.co.kr/RSS/news.xml', 'KR', 'en', 'agency'],
  ['South China Morning Post', 'https://www.scmp.com', 'https://www.scmp.com/rss/91/feed', 'HK', 'en', 'newspaper'],
  // África
  ['News24', 'https://www.news24.com', 'https://feeds.news24.com/articles/news24/TopStories/rss', 'ZA', 'en', 'newspaper'],
  ['Punch', 'https://punchng.com', 'https://punchng.com/feed/', 'NG', 'en', 'newspaper'],
  // Oceanía
  ['ABC Australia', 'https://www.abc.net.au/news', 'https://www.abc.net.au/news/feed/51120/rss.xml', 'AU', 'en', 'broadcast'],
  // Internacional
  ['Al Jazeera', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'QA', 'en', 'broadcast'],
]

// Feeds comprobados como rotos en GitHub Actions (o que bloquean a los robots con 403):
// inactivos hasta encontrar una URL que funcione.
const INACTIVE = new Set(['Excélsior', 'The Times of Israel', 'News24', 'CBC News'])

export const REAL_SOURCES = RAW.map(([name, url, feed_url, country, language, type]) => ({
  name, url, feed_url, country, language, type,
  reliability: null,
  reliability_score: null,
  bias_profile: 'reliability:provisional',
  category: null,
  is_active: !INACTIVE.has(name),
  is_demo: false,
}))

/** Países con edición propia (con prensa propia en el catálogo), en orden de presentación. */
export const EDITIONS = ['ES', 'US', 'GB', 'MX', 'AR', 'CO', 'CL', 'PE', 'FR', 'DE', 'IE', 'CA', 'AU', 'IN']
