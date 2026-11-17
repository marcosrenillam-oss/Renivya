import { getCountryFlag, getCountryName } from '@/lib/countries'

export function countryLabel(code, locale) {
  return `${getCountryFlag(code)} ${getCountryName(code, locale)}`
}
