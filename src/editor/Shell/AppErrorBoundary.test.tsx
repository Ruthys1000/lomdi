import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

/** רכיב שזורק בזמן רינדור, כדי לדמות פאנל עורך פגום */
function Boom(): never {
  throw new Error('העורך התפוצץ בכוונה');
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    // גבול שגיאה מדפיס ל-console.error; משתיקים כדי לא ללכלך את הפלט
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('מציג מסך התאוששות עם טעינה מחדש והורדת גיבוי כשילד זורק', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'טעינה מחדש' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הורדת קובץ גיבוי' })).toBeInTheDocument();
  });

  it('מרנדר את הילדים כרגיל כשאין שגיאה', () => {
    render(
      <AppErrorBoundary>
        <div>תוכן תקין</div>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('תוכן תקין')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
