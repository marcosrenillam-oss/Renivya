// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// MockNewsProvider: datos de DEMOSTRACIÓN (is_demo: true) para desarrollo y modo local.
// Fuentes y actores ficticios, dominio reservado .invalid (nunca resuelve), sin imágenes
// ni autores inventados. Dos rondas para ejercitar evolución, correcciones y contradicciones.

export const DEMO_PROVIDER = 'MockNewsProvider'

export const DEMO_SOURCES = [
  { name: 'Agencia Demo Iberia', url: 'https://agencia-iberia.demo.invalid', country: 'ES', language: 'es', type: 'agency', reliability: 82 },
  { name: 'Diario Demo Atlántico', url: 'https://diario-atlantico.demo.invalid', country: 'ES', language: 'es', type: 'newspaper', reliability: 72 },
  { name: 'Portal Oficial Demo', url: 'https://portal-oficial.demo.invalid', country: 'ES', language: 'es', type: 'official', reliability: 86 },
  { name: 'Demo Wire International', url: 'https://wire.demo.invalid', country: 'GB', language: 'en', type: 'agency', reliability: 84 },
  { name: 'The Demo Chronicle', url: 'https://chronicle.demo.invalid', country: 'US', language: 'en', type: 'newspaper', reliability: 70 },
  { name: 'Le Journal Démo', url: 'https://journal.demo.invalid', country: 'FR', language: 'fr', type: 'newspaper', reliability: 71 },
  { name: 'Jornal Demo', url: 'https://jornal.demo.invalid', country: 'PT', language: 'pt', type: 'newspaper', reliability: 68 },
  { name: 'Demo Data Office', url: 'https://data-office.demo.invalid', country: 'GB', language: 'en', type: 'data', reliability: 88 },
].map((s) => ({ ...s, reliability_score: s.reliability, feed_url: null, bias_profile: 'demo', category: null, is_active: true, is_demo: true }))

const SRC = Object.fromEntries(DEMO_SOURCES.map((s) => [s.name, s]))

/** [evento, fuente, horas atrás, título, cuerpo] */
const ROUND_1 = [
  ['valdecruz', 'Agencia Demo Iberia', 9, 'Un incendio forestal obliga a evacuar a 300 vecinos en la sierra de Valdecruz',
    'Un incendio forestal declarado el martes por la tarde en la sierra de Valdecruz, en España, ha obligado a evacuar a 300 vecinos de dos aldeas. Los equipos de extinción calculan que el fuego ha recorrido unas 1.200 hectáreas de monte bajo y pinar. Según el servicio de emergencias regional, 14 medios aéreos y 220 bomberos trabajan en el perímetro. La alcaldesa de Valdecruz, Elena Robles, pidió a la población que siga las indicaciones de las autoridades. Las altas temperaturas y el viento del este dificultan las tareas de control durante la noche.'],
  ['valdecruz', 'Diario Demo Atlántico', 8, 'El fuego de Valdecruz avanza hacia el valle y ya afecta a 1.250 hectáreas',
    'El incendio de la sierra de Valdecruz, en España, ha afectado ya a 1.250 hectáreas, según las primeras estimaciones de los técnicos forestales. Un total de 300 vecinos fueron evacuados de forma preventiva a un pabellón municipal. Los vecinos describen columnas de humo visibles desde la capital provincial. Los expertos recuerdan que la zona sufrió una sequía prolongada en los últimos años, lo que ha dejado la vegetación muy seca. La investigación sobre el origen del fuego continúa abierta.'],
  ['valdecruz', 'Portal Oficial Demo', 7, 'Comunicado oficial: dispositivo de emergencia por el incendio de Valdecruz',
    'Comunicado oficial del servicio de emergencias: el incendio de Valdecruz, en España, permanece activo y 300 vecinos han sido evacuados de forma preventiva. Participan 14 medios aéreos y 220 bomberos en las labores de extinción. Se ha habilitado un teléfono de información para las familias afectadas. La carretera comarcal que une las dos aldeas permanece cortada hasta nueva orden.'],

  ['lumen', 'Le Journal Démo', 12, 'La start-up parisienne Lumen Labs dévoile un modèle de langage ouvert',
    "La start-up française Lumen Labs, installée à Paris, a présenté mercredi un modèle de langage ouvert de 70 milliards de paramètres. Claire Dumas, directrice générale de Lumen Labs, affirme que le modèle sera publié sous licence libre pour la recherche. L'entreprise indique avoir entraîné son système d'intelligence artificielle sur des données en 24 langues. Selon la société, le modèle a été évalué par des chercheurs indépendants avant sa publication. Plusieurs universités européennes ont déjà demandé un accès anticipé."],
  ['lumen', 'Demo Wire International', 11, 'French start-up Lumen Labs releases open AI language model',
    'French artificial intelligence start-up Lumen Labs, based in Paris, released an open language model with 70 billion parameters on Wednesday. Claire Dumas, chief executive of Lumen Labs, said the model would be available for research under an open licence. The company said the system was trained on data in 24 languages. Analysts said the release adds competition in the European AI market. The company did not disclose how much the training cost.'],
  ['lumen', 'Agencia Demo Iberia', 10, 'Lumen Labs lanza en Francia un modelo de inteligencia artificial abierto',
    'La empresa francesa Lumen Labs ha lanzado en París un modelo de lenguaje abierto de 70.000 millones de parámetros. Su consejera delegada, Claire Dumas, explicó que el modelo de inteligencia artificial se ofrecerá con licencia libre para investigación. La compañía asegura que el sistema funciona en 24 idiomas. Fuentes del sector señalan que podría acelerar la adopción de la inteligencia artificial en universidades europeas.'],

  ['copa', 'Diario Demo Atlántico', 20, 'El Real Valmar CF gana la Copa Demo tras vencer 3-1 al Atlético Norte',
    'El Real Valmar CF se proclamó campeón de la Copa Demo tras imponerse por 3-1 al Atlético Norte en la final disputada en Sevilla. La entrenadora del Real Valmar CF, Marta Ibarra, destacó la intensidad de su equipo en la segunda parte. El delantero Iker Soler marcó dos goles y fue elegido mejor jugador del partido. Unos 42.000 aficionados llenaron el estadio. Es el primer título del club en 15 años.'],
  ['copa', 'Agencia Demo Iberia', 19, 'Final de la Copa Demo: el Real Valmar CF contra el Atlético Norte termina 3-1',
    'La final de la Copa Demo, que enfrentó al Real Valmar CF contra el Atlético Norte en Sevilla, terminó con victoria del Real Valmar CF por 3-1. Iker Soler anotó dos goles para el campeón y el Atlético Norte recortó distancias en el minuto 78. Según la organización, asistieron 45.000 espectadores al estadio. Marta Ibarra, entrenadora del Real Valmar CF, dedicó el título a la afición.'],

  ['kesra', 'Demo Wire International', 6, 'Floods in Kenya displace thousands in the Kesra region',
    'Heavy floods in the Kesra region of Kenya have displaced about 8,000 people, according to local officials. At least 12 people were killed after two rivers burst their banks on Monday night. Rescue teams are using boats to reach villages cut off by the water. Unconfirmed reports said a small dam upstream could fail if the rain continues. The Kenya Red Cross said it had set up three temporary shelters.'],
  ['kesra', 'The Demo Chronicle', 5, 'Kenya flood death toll rises in Kesra as rain continues',
    'The death toll from floods in Kenya’s Kesra region has risen to 30 people, according to a hospital official quoted by local media. About 8,000 residents have been displaced from their homes. The government said emergency funding would be released this week. Residents said roads to the regional capital remained under water. Forecasters expect more rain over the next 48 hours.'],
  ['kesra', 'Agencia Demo Iberia', 4, 'Las inundaciones en Kenia dejan miles de desplazados en la región de Kesra',
    'Las inundaciones en la región keniana de Kesra han obligado a desplazarse a unas 8.000 personas, según las autoridades locales. Al menos 12 personas han muerto tras el desbordamiento de dos ríos. Según fuentes no confirmadas, una pequeña presa podría ceder si continúan las lluvias. La Cruz Roja ha habilitado tres albergues temporales en la zona.'],

  ['northbridge', 'The Demo Chronicle', 14, 'Cyberattack shuts down Northbridge public library network in the United States',
    'A cyberattack has shut down the public library network of Northbridge, a mid-sized city in the United States, for the third consecutive day. City officials said the ransomware attack affected 26 branches and the online catalogue. No personal data has been confirmed as stolen, officials said. The library system said printed collections remain available but loans are being recorded by hand.'],
  ['northbridge', 'Demo Wire International', 13, 'Ransomware attack hits 26 library branches in Northbridge, US',
    'Ransomware has disrupted 26 public library branches in Northbridge, in the United States, city officials said. The attack began on Saturday and also took the online catalogue offline. Officials said they had not confirmed any theft of personal data. Cybersecurity experts are working with the city to restore systems.'],

  ['oporto', 'Jornal Demo', 3, 'Hospital Demo do Porto regista aumento de casos de gripe',
    'O Hospital Demo do Porto, em Portugal, registou um aumento de casos de gripe nas urgências esta semana. A direção do hospital pede à população que se vacine.'],

  ['solar', 'Jornal Demo', 30, 'Consórcio Helios Grid inaugura parque solar flutuante em Portugal',
    'O consórcio Helios Grid inaugurou um parque solar flutuante na barragem de Montemor, em Portugal, com capacidade de 70 megawatts. Segundo a empresa, a instalação poderá abastecer cerca de 30.000 casas com energia renovável. O projeto ocupa 50 hectares da superfície da barragem. Ambientalistas pediram estudos de impacto sobre a fauna aquática.'],
  ['solar', 'Agencia Demo Iberia', 29, 'Helios Grid abre en Portugal un parque solar flotante de 70 megavatios',
    'El consorcio Helios Grid ha inaugurado en el embalse de Montemor, en Portugal, un parque solar flotante de 70 megavatios. La compañía calcula que abastecerá a unos 30.000 hogares con energía renovable. La instalación cubre 50 hectáreas del embalse. Organizaciones ecologistas reclaman un seguimiento del impacto sobre la fauna.'],
]

const ROUND_2 = [
  ['valdecruz', 'Portal Oficial Demo', 2, 'El incendio de Valdecruz queda estabilizado tras afectar a 1.300 hectáreas',
    'Comunicado oficial del servicio de emergencias: el incendio de la sierra de Valdecruz, en España, ha quedado estabilizado durante la madrugada. La superficie afectada asciende a 1.300 hectáreas según la medición por satélite. Los 300 vecinos evacuados podrán regresar a sus casas a partir del mediodía. Los equipos mantendrán la vigilancia en el perímetro durante las próximas 48 horas.'],
  ['valdecruz', 'Diario Demo Atlántico', 1.5, 'Fe de errores: el incendio de Valdecruz afectó a 1.300 hectáreas',
    'Corrección: en una información anterior indicamos que el incendio de la sierra de Valdecruz, en España, afectaba a 1.250 hectáreas; la cifra oficial actualizada es de 1.300 hectáreas. El fuego está estabilizado y los 300 vecinos evacuados regresan a sus hogares. La investigación sobre las causas sigue abierta.'],
  ['kesra', 'Le Journal Démo', 1, 'Inondations au Kenya : au moins 18 morts dans la région de Kesra',
    "Les inondations dans la région de Kesra, au Kenya, ont fait au moins 18 morts selon un bilan provisoire des autorités. Environ 8 000 personnes ont été déplacées. La Croix-Rouge kényane a ouvert trois abris temporaires. Les pluies devraient se poursuivre dans les prochains jours."],
  ['lumen', 'Jornal Demo', 2.5, 'Startup francesa Lumen Labs lança modelo de inteligência artificial aberto',
    'A startup francesa Lumen Labs, sediada em Paris, lançou um modelo de linguagem aberto com 70 mil milhões de parâmetros. Claire Dumas, diretora executiva da Lumen Labs, afirmou que o modelo de inteligência artificial estará disponível para investigação. Universidades portuguesas já pediram acesso ao sistema.'],
  ['sismo', 'Demo Wire International', 0.6, 'Breaking: magnitude 6.1 earthquake strikes southern Chile',
    'Breaking: A magnitude 6.1 earthquake struck southern Chile on Thursday morning, according to the national seismological service. Authorities said there were no immediate reports of victims. Residents in several coastal towns evacuated as a precaution. A tsunami warning was issued and later lifted after 40 minutes.'],
  ['sismo', 'Agencia Demo Iberia', 0.5, 'Última hora: un terremoto de magnitud 6,1 sacude el sur de Chile',
    'Última hora: un terremoto de magnitud 6,1 ha sacudido el sur de Chile este jueves, según el servicio sismológico nacional. Las autoridades no tienen constancia por ahora de víctimas. Varias localidades costeras fueron evacuadas de forma preventiva y la alerta de tsunami se levantó tras 40 minutos.'],
  ['sismo', 'Demo Data Office', 0.4, 'Seismic data: magnitude 6.1 event recorded off the coast of Chile',
    'The seismic data service recorded a magnitude 6.1 earthquake off the coast of southern Chile at a depth of 35 kilometres. The event was followed by 12 aftershocks above magnitude 4 in the first hour. A tsunami warning issued for the coast of Chile was lifted after 40 minutes.'],
]

function slug(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

/** NewsItems de demo para la ronda indicada (1 o 2), con fechas relativas a `now`. */
export function demoNewsItems(round = 1, now = new Date()) {
  const rows = round === 2 ? ROUND_2 : ROUND_1
  const t = new Date(now).getTime()
  return rows.map(([event, sourceName, hoursAgo, title, content]) => {
    const source = SRC[sourceName]
    const published = new Date(t - hoursAgo * 3_600_000).toISOString()
    return {
      provider: DEMO_PROVIDER,
      source_name: sourceName,
      url: `${source.url}/${event}/${slug(title)}`,
      title,
      description: content.split('. ')[0] + '.',
      content,
      author: null,
      image_url: null,
      published_at: published,
      retrieved_at: new Date(t).toISOString(),
      language: source.language,
      country: source.country,
      status: 'pending',
      is_demo: true,
    }
  })
}

export function createMockNewsProvider() {
  return {
    name: DEMO_PROVIDER,
    isDemo: true,
    sources: DEMO_SOURCES,
    async fetch({ round = 1, now = new Date() } = {}) {
      return demoNewsItems(round, now)
    },
  }
}
