import { AnimatePresence, motion } from 'framer-motion'
import WorldCountryHeader from '@/components/world/WorldCountryHeader'
import CountryStoryList from '@/components/world/CountryStoryList'

export default function CountryStoryPanel({ code, stories, onClear }) {
  return (
    <AnimatePresence mode="wait">
      {code && (
        <motion.div key={code} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="glass-card p-5 sm:p-6">
          <WorldCountryHeader code={code} count={stories.length} onClear={onClear} />
          <div className="mt-3">
            <CountryStoryList stories={stories} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
