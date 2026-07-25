import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  FileText,
  Flag,
  Heart,
  HelpCircle,
  Info,
  Lightbulb,
  Lock,
  Mail,
  MessageCircleQuestion,
  Play,
  Rocket,
  Scissors,
  Settings,
  Shield,
  Sparkle,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * ערכת האייקונים של הלומדה — רשימה סגורה בכוונה.
 *
 * בלוקי הכרטיסים והמפריד שומרים שם אייקון כמחרוזת. אילו הרנדרר היה מייבא
 * את lucide דינמית לפי השם, כל ספריית האייקונים (אלפי רכיבים) הייתה נכנסת
 * לחבילת הלומדה. רשימה סגורה שומרת על התוצר קטן, ובמקביל נותנת לספריית
 * הבחירה בעורך קטלוג ברור.
 */
export const courseIcons = {
  Sparkles,
  Sparkle,
  Target,
  Lightbulb,
  Rocket,
  Star,
  Award,
  TrendingUp,
  Users,
  Shield,
  Lock,
  Clock,
  Flag,
  Compass,
  BookOpen,
  FileText,
  ClipboardList,
  MessageCircleQuestion,
  HelpCircle,
  Info,
  AlertTriangle,
  Check,
  X,
  Heart,
  ThumbsUp,
  Zap,
  Scissors,
  Settings,
  Mail,
  Play,
} satisfies Record<string, LucideIcon>;

export type CourseIconName = keyof typeof courseIcons;

export const courseIconNames = Object.keys(courseIcons) as CourseIconName[];

export function getCourseIcon(name: string): LucideIcon | undefined {
  return courseIcons[name as CourseIconName];
}

/** אייקוני ניווט — לא חלק מהקטלוג שהמשתמש בוחר ממנו */
export const navIcons = { ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight };
