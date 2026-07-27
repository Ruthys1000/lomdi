import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCourse } from '@/model/factory';
import { useBackupStore } from '@/state/backupStore';
import { useCourseStore } from '@/state/courseStore';
import { useBackupReminder } from './useBackupReminder';

/** האם דיאלוג היציאה יופיע כעת — כלומר beforeunload מבוטל */
function unloadWouldPrompt(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('useBackupReminder', () => {
  beforeEach(() => {
    useCourseStore.getState().loadCourse(createCourse({ title: 'א' }));
    useBackupStore.setState({ dirtySinceBackup: false });
  });

  afterEach(() => {
    useCourseStore.getState().closeCourse();
  });

  it('אינו מזהיר כשאין שינוי מאז הגיבוי', () => {
    renderHook(() => useBackupReminder());
    expect(unloadWouldPrompt()).toBe(false);
  });

  it('מזהיר לפני יציאה אחרי עריכה במסמך', () => {
    renderHook(() => useBackupReminder());

    act(() => {
      useCourseStore.getState().updateCourse({ title: 'שם חדש' });
    });

    expect(useBackupStore.getState().dirtySinceBackup).toBe(true);
    expect(unloadWouldPrompt()).toBe(true);
  });

  it('מפסיק להזהיר אחרי גיבוי לקובץ', () => {
    renderHook(() => useBackupReminder());

    act(() => {
      useCourseStore.getState().updateCourse({ title: 'שם חדש' });
    });
    act(() => {
      useBackupStore.getState().markBackedUp();
    });

    expect(unloadWouldPrompt()).toBe(false);
  });

  it('טעינת לומדה אחרת נחשבת גיבוי ולא עריכה', () => {
    renderHook(() => useBackupReminder());

    act(() => {
      useCourseStore.getState().updateCourse({ title: 'שם חדש' });
    });
    expect(useBackupStore.getState().dirtySinceBackup).toBe(true);

    act(() => {
      useCourseStore.getState().loadCourse(createCourse({ title: 'לומדה אחרת' }));
    });
    expect(useBackupStore.getState().dirtySinceBackup).toBe(false);
    expect(unloadWouldPrompt()).toBe(false);
  });
});
