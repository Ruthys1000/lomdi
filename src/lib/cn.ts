type ClassValue = string | false | null | undefined;

/** צירוף קלאסים מותנים, בלי תלות חיצונית */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
