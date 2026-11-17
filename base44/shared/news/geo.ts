// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Geografía compartida por motor e interfaz: centroides, regiones y gazetteer de ciudades.

export const COUNTRY_COORDINATES = {
  ES: [40.4, -3.7], PT: [39.6, -8.0], FR: [46.6, 2.4], DE: [51.1, 10.4], IT: [42.8, 12.6],
  GB: [54.0, -2.0], IE: [53.2, -8.2], NL: [52.2, 5.5], BE: [50.6, 4.6], LU: [49.8, 6.1],
  CH: [46.8, 8.2], AT: [47.6, 14.1], DK: [56.0, 10.0], SE: [62.0, 15.0], NO: [61.0, 9.0],
  FI: [64.0, 26.0], IS: [64.9, -18.6], PL: [52.0, 19.4], CZ: [49.8, 15.5], SK: [48.7, 19.7],
  HU: [47.2, 19.5], RO: [45.9, 25.0], BG: [42.7, 25.5], GR: [39.1, 22.0], HR: [45.1, 15.2],
  SI: [46.1, 14.8], RS: [44.0, 20.9], BA: [44.2, 17.8], ME: [42.7, 19.4], MK: [41.6, 21.7],
  AL: [41.2, 20.2], EE: [58.6, 25.0], LV: [56.9, 24.6], LT: [55.2, 23.9], UA: [49.0, 31.4],
  BY: [53.7, 27.9], MD: [47.4, 28.4], RU: [61.5, 95.0], CY: [35.1, 33.4], MT: [35.9, 14.4],
  AD: [42.5, 1.6], MC: [43.7, 7.4], VA: [41.9, 12.45],
  US: [39.8, -98.6], CA: [56.1, -106.3], MX: [23.6, -102.5], GT: [15.8, -90.2], HN: [15.2, -86.2],
  SV: [13.8, -88.9], NI: [12.9, -85.2], CR: [9.7, -83.8], PA: [8.5, -80.8], CU: [21.5, -77.8],
  DO: [18.7, -70.2], PR: [18.2, -66.5], HT: [19.0, -72.3], JM: [18.1, -77.3], CO: [4.6, -74.3],
  VE: [6.4, -66.6], EC: [-1.8, -78.2], PE: [-9.2, -75.0], BO: [-16.3, -63.6], CL: [-35.7, -71.5],
  AR: [-38.4, -63.6], UY: [-32.5, -55.8], PY: [-23.4, -58.4], BR: [-14.2, -51.9],
  CN: [35.9, 104.2], JP: [36.2, 138.3], KR: [35.9, 127.8], KP: [40.3, 127.5], TW: [23.7, 121.0],
  HK: [22.3, 114.2], IN: [20.6, 79.0], PK: [30.4, 69.3], BD: [23.7, 90.4], LK: [7.9, 80.8],
  NP: [28.4, 84.1], AF: [33.9, 67.7], KZ: [48.0, 66.9], UZ: [41.4, 64.6], MN: [46.9, 103.8],
  TH: [15.9, 101.0], VN: [14.1, 108.3], MY: [4.2, 102.0], SG: [1.35, 103.8], ID: [-0.8, 113.9],
  PH: [12.9, 121.8], MM: [21.9, 96.0], KH: [12.6, 105.0],
  TR: [39.0, 35.2], IL: [31.0, 34.85], PS: [31.95, 35.23], LB: [33.85, 35.86], SY: [34.8, 39.0],
  JO: [30.6, 36.2], IQ: [33.2, 43.7], IR: [32.4, 53.7], SA: [23.9, 45.1], AE: [23.4, 53.8],
  QA: [25.35, 51.18], KW: [29.3, 47.5], BH: [26.07, 50.56], OM: [21.5, 55.9], YE: [15.55, 48.5],
  EG: [26.8, 30.8], LY: [26.3, 17.2], TN: [33.9, 9.5], DZ: [28.0, 1.66], MA: [31.8, -7.1],
  SD: [12.9, 30.2], SS: [6.9, 31.3], ET: [9.1, 40.5], SO: [5.15, 46.2], KE: [0.0, 37.9],
  UG: [1.37, 32.3], TZ: [-6.4, 34.9], RW: [-1.94, 29.9], CD: [-4.0, 21.8], CG: [-0.23, 15.8],
  CM: [7.37, 12.35], NG: [9.08, 8.68], GH: [7.95, -1.02], CI: [7.54, -5.55], SN: [14.5, -14.45],
  ML: [17.6, -4.0], NE: [17.6, 8.08], BF: [12.24, -1.56], TD: [15.45, 18.7], ZA: [-30.6, 22.9],
  ZW: [-19.0, 29.15], ZM: [-13.1, 27.85], MZ: [-18.7, 35.5], AO: [-11.2, 17.9], NA: [-22.96, 18.5],
  BW: [-22.3, 24.7], MG: [-18.8, 47.0],
  AU: [-25.3, 133.8], NZ: [-40.9, 174.9], PG: [-6.3, 143.96], FJ: [-17.7, 178.1],
}

export const COUNTRY_CODES = Object.keys(COUNTRY_COORDINATES)

const REGION_MEMBERS = {
  europe: 'ES PT FR DE IT GB IE NL BE LU CH AT DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS BA ME MK AL EE LV LT UA BY MD RU CY MT AD MC VA',
  americas: 'US CA MX GT HN SV NI CR PA CU DO PR HT JM CO VE EC PE BO CL AR UY PY BR',
  asia: 'CN JP KR KP TW HK IN PK BD LK NP AF KZ UZ MN TH VN MY SG ID PH MM KH',
  middle_east: 'TR IL PS LB SY JO IQ IR SA AE QA KW BH OM YE',
  africa: 'EG LY TN DZ MA SD SS ET SO KE UG TZ RW CD CG CM NG GH CI SN ML NE BF TD ZA ZW ZM MZ AO NA BW MG',
  oceania: 'AU NZ PG FJ',
}

export const REGIONS = Object.keys(REGION_MEMBERS)

export const COUNTRY_REGION = Object.fromEntries(
  Object.entries(REGION_MEMBERS).flatMap(([region, list]) => list.split(' ').map((code) => [code, region]))
)

export function getCountryCoordinates(code) {
  return COUNTRY_COORDINATES[code] ?? null
}

/**
 * Ciudades reconocidas (nombre canónico + variantes multilingües) → país.
 * Se usan para detectar país y como entidades de tipo `city`.
 */
export const CITY_GAZETTEER = [
  ['Madrid', 'ES'], ['Barcelona', 'ES'], ['Valencia', 'ES'], ['Sevilla', 'ES', ['Seville', 'Séville']], ['Bilbao', 'ES'],
  ['París', 'FR', ['Paris']], ['Marsella', 'FR', ['Marseille']], ['Lyon', 'FR'],
  ['Berlín', 'DE', ['Berlin']], ['Múnich', 'DE', ['Munich', 'München']], ['Fráncfort', 'DE', ['Frankfurt', 'Francfort']],
  ['Londres', 'GB', ['London']], ['Mánchester', 'GB', ['Manchester']], ['Liverpool', 'GB'],
  ['Roma', 'IT', ['Rome']], ['Milán', 'IT', ['Milan', 'Milano']],
  ['Lisboa', 'PT', ['Lisbon', 'Lisbonne']], ['Oporto', 'PT', ['Porto']],
  ['Bruselas', 'BE', ['Brussels', 'Bruxelles']], ['Ámsterdam', 'NL', ['Amsterdam']], ['Viena', 'AT', ['Vienna', 'Vienne', 'Wien']],
  ['Varsovia', 'PL', ['Warsaw', 'Varsovie']], ['Atenas', 'GR', ['Athens', 'Athènes']], ['Estocolmo', 'SE', ['Stockholm']],
  ['Oslo', 'NO'], ['Copenhague', 'DK', ['Copenhagen']], ['Helsinki', 'FI'], ['Dublín', 'IE', ['Dublin']], ['Berna', 'CH', ['Bern', 'Berne']],
  ['Ginebra', 'CH', ['Geneva', 'Genève']], ['Moscú', 'RU', ['Moscow', 'Moscou']], ['Kiev', 'UA', ['Kyiv', 'Kiyv']],
  ['Washington', 'US'], ['Nueva York', 'US', ['New York']], ['Los Ángeles', 'US', ['Los Angeles']], ['San Francisco', 'US'],
  ['Chicago', 'US'], ['Miami', 'US'], ['Ottawa', 'CA'], ['Toronto', 'CA'], ['Montreal', 'CA', ['Montréal']],
  ['Ciudad de México', 'MX', ['Mexico City']], ['Buenos Aires', 'AR'], ['Brasilia', 'BR', ['Brasília']],
  ['São Paulo', 'BR', ['Sao Paulo', 'San Pablo']], ['Río de Janeiro', 'BR', ['Rio de Janeiro']], ['Bogotá', 'CO', ['Bogota']],
  ['Lima', 'PE'], ['Caracas', 'VE'], ['Quito', 'EC'], ['Montevideo', 'UY'],
  ['Pekín', 'CN', ['Beijing', 'Pékin']], ['Shanghái', 'CN', ['Shanghai']], ['Hong Kong', 'HK'], ['Tokio', 'JP', ['Tokyo']],
  ['Seúl', 'KR', ['Seoul', 'Séoul']], ['Pyongyang', 'KP'], ['Taipéi', 'TW', ['Taipei']], ['Nueva Delhi', 'IN', ['New Delhi']],
  ['Bombay', 'IN', ['Mumbai']], ['Islamabad', 'PK'], ['Kabul', 'AF'], ['Bangkok', 'TH'], ['Hanói', 'VN', ['Hanoi']],
  ['Yakarta', 'ID', ['Jakarta']], ['Manila', 'PH'], ['Singapur', 'SG', ['Singapore']],
  ['Jerusalén', 'IL', ['Jerusalem', 'Jérusalem']], ['Tel Aviv', 'IL'], ['Gaza', 'PS'], ['Teherán', 'IR', ['Tehran', 'Téhéran']],
  ['Bagdad', 'IQ', ['Baghdad']], ['Damasco', 'SY', ['Damascus', 'Damas']], ['Beirut', 'LB', ['Beyrouth']], ['Amán', 'JO', ['Amman']],
  ['Ankara', 'TR'], ['Estambul', 'TR', ['Istanbul']], ['Riad', 'SA', ['Riyadh']], ['Doha', 'QA'], ['Dubái', 'AE', ['Dubai', 'Dubaï']],
  ['Abu Dabi', 'AE', ['Abu Dhabi']], ['El Cairo', 'EG', ['Cairo', 'Le Caire']], ['Rabat', 'MA'], ['Argel', 'DZ', ['Algiers', 'Alger']],
  ['Trípoli', 'LY', ['Tripoli']], ['Jartum', 'SD', ['Khartoum']], ['Adís Abeba', 'ET', ['Addis Ababa', 'Addis-Abeba']],
  ['Nairobi', 'KE'], ['Lagos', 'NG'], ['Abuya', 'NG', ['Abuja']], ['Johannesburgo', 'ZA', ['Johannesburg']],
  ['Pretoria', 'ZA'], ['Ciudad del Cabo', 'ZA', ['Cape Town', 'Le Cap']], ['Kinsasa', 'CD', ['Kinshasa']],
  ['Canberra', 'AU'], ['Sídney', 'AU', ['Sydney']], ['Melbourne', 'AU'], ['Wellington', 'NZ'],
].map(([name, country, aliases = []]) => ({ name, country, aliases }))

/** Gentilicios frecuentes (peso menor que el nombre del país). */
export const DEMONYMS = {
  ES: ['español', 'española', 'españoles', 'spanish', 'espagnol', 'espanhol'],
  FR: ['francés', 'francesa', 'french', 'français', 'française', 'francês'],
  DE: ['alemán', 'alemana', 'german', 'allemand', 'alemão'],
  IT: ['italiano', 'italiana', 'italian', 'italien'],
  GB: ['británico', 'británica', 'british', 'britannique', 'britânico'],
  US: ['estadounidense', 'estadounidenses', 'american', 'américain', 'norte-americano'],
  RU: ['ruso', 'rusa', 'russian', 'russe', 'russo'],
  UA: ['ucraniano', 'ucraniana', 'ukrainian', 'ukrainien'],
  CN: ['chino', 'china', 'chinese', 'chinois', 'chinês'],
  JP: ['japonés', 'japonesa', 'japanese', 'japonais'],
  IL: ['israelí', 'israelíes', 'israeli', 'israélien'],
  PS: ['palestino', 'palestina', 'palestinian', 'palestinien'],
  IR: ['iraní', 'iranian', 'iranien'],
  MX: ['mexicano', 'mexicana', 'mexican', 'mexicain'],
  BR: ['brasileño', 'brasileña', 'brazilian', 'brésilien', 'brasileiro'],
  AR: ['argentino', 'argentina', 'argentine'],
  PT: ['luso', 'lusa'],
  MA: ['marroquí', 'moroccan', 'marocain'],
  IN: ['indio', 'india', 'indian', 'indien'],
  TR: ['turco', 'turca', 'turkish', 'turc'],
}
