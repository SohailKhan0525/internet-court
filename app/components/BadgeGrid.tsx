'use client';

import { FileText, Scales, Lightning, Megaphone, SealCheck, type Icon } from '@phosphor-icons/react';

export type Badge = { code: string; label: string; description: string; earned: boolean };

const ICONS: Record<string, Icon> = {
  first_filing: FileText,
  juror: Scales,
  active_juror: Lightning,
  heard_case: Megaphone,
  member: SealCheck,
};

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
      style={{ marginTop: 20 }}
      aria-label="Achievements"
    >
      {badges.map((badge) => {
        const IconComponent = ICONS[badge.code] ?? SealCheck;
        return (
          <div
            key={badge.code}
            title={badge.description}
            className={`flex flex-col items-center gap-2 rounded-sm border p-3 text-center transition-opacity ${
              badge.earned
                ? 'border-[#1a1a1a] bg-[#f8f7f3] opacity-100'
                : 'border-[#e4e2dc] bg-transparent opacity-40'
            }`}
          >
            <IconComponent size={22} weight={badge.earned ? 'fill' : 'thin'} color={badge.earned ? '#1a1a1a' : '#8a8880'} />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wide" style={{ color: badge.earned ? '#1a1a1a' : '#8a8880' }}>
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
