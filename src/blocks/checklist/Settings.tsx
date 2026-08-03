import { createId } from '@/model/ids';
import type { BlockOf } from '@/model/types';
import { FieldGroup, FieldNote, SwitchField, TextField } from '@/editor/controls/Field';
import { SubItemList } from '@/editor/controls/SubItemList';
import { createChecklistItem, type ChecklistItem, type ChecklistContent } from './content';

export function ChecklistSettings({
  block,
  onChange,
}: {
  block: BlockOf<ChecklistContent>;
  onChange: (content: ChecklistContent) => void;
}) {
  const { content } = block;
  const update = (patch: Partial<ChecklistContent>) => onChange({ ...content, ...patch });

  return (
    <>
      <FieldGroup title="תצוגה">
        <SwitchField
          label="מונה השלמה"
          hint='מציג "X מתוך N הושלמו" מתחת לרשימה. פעיל בתצוגה מקדימה ובתוצר.'
          checked={content.showCount}
          onChange={(showCount) => update({ showCount })}
        />
      </FieldGroup>

      <FieldGroup title="פריטים">
        <SubItemList
          label="הפריטים ברשימה"
          addLabel="הוספת פריט"
          items={content.items}
          onChange={(items) => update({ items })}
          createItem={() => createChecklistItem({ text: '' })}
          duplicateItem={(item) => ({ ...structuredClone(item), id: createId('checklistItem') })}
          minItems={1}
          maxItems={20}
          renderItem={(item) => (
            <ChecklistItemFields
              item={item}
              onPatch={(patch) =>
                update({
                  items: content.items.map((current) =>
                    current.id === item.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
        <FieldNote>את הטקסט והתיאור אפשר לערוך גם ישירות על הפריט בקנבס.</FieldNote>
      </FieldGroup>
    </>
  );
}

function ChecklistItemFields({
  item,
  onPatch,
}: {
  item: ChecklistItem;
  onPatch: (patch: Partial<ChecklistItem>) => void;
}) {
  return (
    <>
      <TextField label="טקסט" value={item.text} onChange={(text) => onPatch({ text })} />
      <TextField
        label="תיאור (לא חובה)"
        value={item.description}
        onChange={(description) => onPatch({ description })}
      />
    </>
  );
}
