import { render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import type { AssetMeta } from '@/model/types';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { AssetLibraryModal } from './AssetLibraryModal';

/**
 * jsdom אינו מממש `<dialog>`. בלי הדמה הזו הרכיב מרונדר אבל התוכן שלו
 * נשאר מוסתר, וכל שאילתה עליו נכשלת מסיבה שאינה קשורה לקוד הנבדק.
 */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

const asset = (id: string, overrides: Partial<AssetMeta> = {}): AssetMeta => ({
  id,
  originalName: `${id}.png`,
  safeName: `${id}.png`,
  kind: 'image',
  mimeType: 'image/png',
  size: 2048,
  exportPath: `assets/images/${id}.png`,
  ...overrides,
});

function setup(assets: AssetMeta[], usedAssetId?: string) {
  useAssetStore.setState({
    assets,
    urls: Object.fromEntries(assets.map((item) => [item.id, `blob:mock/${item.id}`])),
  });

  useCourseStore.setState({
    course: createCourse({
      chapters: [
        createChapter({
          blocks: usedAssetId
            ? [
                createBlock('image', {
                  content: { ...createBlock('image').content, assetId: usedAssetId },
                }),
              ]
            : [],
        }),
      ],
    }),
  });
}

beforeEach(() => {
  useAssetStore.setState({ assets: [], urls: {} });
  useCourseStore.setState({ course: null });
});

describe('ספריית הנכסים', () => {
  it('מציגה את נכסי הפרויקט', () => {
    setup([asset('asset-a'), asset('asset-b')]);
    render(<AssetLibraryModal open onClose={() => undefined} />);

    expect(screen.getByText('asset-a.png')).toBeInTheDocument();
    expect(screen.getByText('asset-b.png')).toBeInTheDocument();
  });

  it('מסמנת נכס שאף בלוק אינו מפנה אליו', () => {
    setup([asset('asset-used'), asset('asset-orphan')], 'asset-used');
    render(<AssetLibraryModal open onClose={() => undefined} />);

    const orphan = screen.getByText('asset-orphan.png').closest('li')!;
    const used = screen.getByText('asset-used.png').closest('li')!;

    expect(within(orphan).getByText('לא בשימוש')).toBeInTheDocument();
    expect(within(used).queryByText('לא בשימוש')).toBeNull();
  });

  it('מסננת לפי סוג כשהיא נפתחת כבורר מתוך בלוק', () => {
    setup([
      asset('asset-image'),
      asset('asset-clip', { kind: 'video', mimeType: 'video/mp4', originalName: 'clip.mp4' }),
    ]);

    render(<AssetLibraryModal open kind="video" onClose={() => undefined} onPick={() => undefined} />);

    expect(screen.getByText('clip.mp4')).toBeInTheDocument();
    expect(screen.queryByText('asset-image.png')).toBeNull();
  });

  it('מציגה מצב ריק מסביר כשאין נכסים', () => {
    setup([]);
    render(<AssetLibraryModal open onClose={() => undefined} />);

    expect(screen.getByText('עדיין אין נכסים בפרויקט')).toBeInTheDocument();
  });

  it('מבחינה בין "אין נכסים" לבין "החיפוש לא מצא"', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    setup([asset('asset-a')]);
    render(<AssetLibraryModal open onClose={() => undefined} />);

    await userEvent.type(screen.getByLabelText('חיפוש נכס'), 'אין כזה');

    expect(screen.getByText('אין נכס שתואם את החיפוש')).toBeInTheDocument();
  });

  it('מחזירה את המזהה הנבחר, ולעולם לא את הכתובת', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const onPick = vi.fn();
    setup([asset('asset-a')]);

    render(<AssetLibraryModal open onClose={() => undefined} onPick={onPick} />);
    await userEvent.click(screen.getByText('asset-a.png'));

    expect(onPick).toHaveBeenCalledWith('asset-a');
  });

  it('מסבירה לפני מחיקה אם הנכס בשימוש', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    setup([asset('asset-used')], 'asset-used');

    render(<AssetLibraryModal open onClose={() => undefined} />);
    await userEvent.click(screen.getByLabelText('מחיקת asset-used.png'));

    expect(screen.getByRole('alertdialog')).toHaveTextContent('הנכס מופיע בלומדה');
  });
});
