import type { BlockOf } from '@/model/types';
import type { StatItem, StatsContent } from './content';

/**
 * בלוק מספרים/סטטיסטיקה — ערכים גדולים שנסרקים במבט.
 *
 * הווריאציה היא קלאס `.lc-stats--v-*` בלבד; העיצוב חי כולו ב-course.css.
 */
export function StatsRenderer({ block }: { block: BlockOf<StatsContent> }) {
  const { content } = block;

  return (
    <div className="lc-container">
      <ul
        className={[
          'lc-stats',
          `lc-stats--v-${content.variant || 'plain'}`,
          `lc-stats--cols-${content.columns}`,
        ].join(' ')}
      >
        {content.items.map((item) => (
          <Stat key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function Stat({ item }: { item: StatItem }) {
  return (
    <li className="lc-stat">
      {item.value && <span className="lc-stat__value">{item.value}</span>}
      {item.label && <span className="lc-stat__label">{item.label}</span>}
      {item.sub && <span className="lc-stat__sub">{item.sub}</span>}
    </li>
  );
}
