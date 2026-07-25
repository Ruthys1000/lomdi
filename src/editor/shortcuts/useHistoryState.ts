import { useEffect, useState } from 'react';
import { useCourseStore } from '@/state/courseStore';

/**
 * מצב ההיסטוריה עבור כפתורי הביטול והביצוע-מחדש.
 *
 * ה-store הזמני של zundo הוא store נפרד של zustand, ואינו מעדכן רכיבים
 * שמנויים ל-courseStore. מכאן המנוי הישיר: בלעדיו הכפתורים היו נשארים
 * מושבתים גם אחרי שינוי, כי כלום לא היה גורם להם לרנדר מחדש.
 */
export function useHistoryState() {
  const [state, setState] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    const temporal = useCourseStore.temporal;

    const sync = () => {
      const { pastStates, futureStates } = temporal.getState();
      setState({ canUndo: pastStates.length > 0, canRedo: futureStates.length > 0 });
    };

    sync();
    return temporal.subscribe(sync);
  }, []);

  return state;
}
