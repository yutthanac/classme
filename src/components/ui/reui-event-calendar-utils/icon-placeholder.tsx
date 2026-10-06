// @ts-nocheck
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
  Repeat,
  type LucideIcon,
} from 'lucide-react';

interface IconPlaceholderProps extends React.SVGProps<SVGSVGElement> {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  ChevronLeftIcon: ChevronLeft,
  ChevronRightIcon: ChevronRight,
  ChevronDownIcon: ChevronDown,
  CalendarIcon: CalendarIcon,
  CalendarBlankIcon: CalendarIcon,
  PlusIcon: Plus,
  RepeatIcon: Repeat,
};

export function IconPlaceholder({
  lucide,
  className,
  ...props
}: IconPlaceholderProps) {
  const IconComponent = (lucide && ICON_MAP[lucide]) || CalendarIcon;
  return <IconComponent className={className} {...props} />;
}
