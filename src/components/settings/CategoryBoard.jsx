import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const COLUMNS = ['preferred', 'available', 'excluded']

/** Tres columnas arrastrables: preferidos (ordenados), disponibles y excluidos. */
export default function CategoryBoard({ preferred = [], excluded = [], onChange }) {
  const { t } = useI18n()
  const all = CATEGORIES.map((c) => c.id)
  const lists = {
    preferred: preferred.filter((c) => all.includes(c)),
    excluded: excluded.filter((c) => all.includes(c) && !preferred.includes(c)),
  }
  lists.available = all.filter((c) => !lists.preferred.includes(c) && !lists.excluded.includes(c))

  function onDragEnd({ source, destination, draggableId }) {
    if (!destination) return
    const next = { preferred: [...lists.preferred], available: [...lists.available], excluded: [...lists.excluded] }
    next[source.droppableId].splice(source.index, 1)
    next[destination.droppableId].splice(destination.index, 0, draggableId)
    onChange({ preferred_categories: next.preferred, excluded_categories: next.excluded })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col}>
            <p className={cn('eyebrow mb-2', col === 'preferred' && 'text-primary', col === 'excluded' && 'text-destructive')}>{t(`settings.${col}`)}</p>
            <Droppable droppableId={col}>
              {(provided, snapshot) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn('min-h-[8rem] space-y-1.5 rounded-xl border border-dashed p-2 transition-colors', snapshot.isDraggingOver && 'border-primary/50 bg-primary/5')}
                >
                  {lists[col].map((id, index) => {
                    const meta = getCategory(id)
                    const Icon = meta.icon
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(p, s) => (
                          <li
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={cn('flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm', s.isDragging && 'shadow-lg ring-1 ring-primary/30')}
                          >
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className="flex-1">{t(`category.${id}`)}</span>
                            {col === 'preferred' && <span className="type-caption text-muted-foreground">{index + 1}</span>}
                          </li>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                  {!lists[col].length && <li className="type-caption px-2 py-6 text-center text-muted-foreground">{t('settings.dragHere')}</li>}
                </ul>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
