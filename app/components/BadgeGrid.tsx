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
    <div className="badge-grid" aria-label="Achievements">
      {badges.map((badge) => {
        const IconComponent = ICONS[badge.code] ?? SealCheck;
        return (
          <div key={badge.code} title={badge.description} className={`badge-seal ${badge.earned ? 'badge-seal-earned' : 'badge-seal-locked'}`}>
            <span className="badge-seal-shine" aria-hidden="true" />
            <IconComponent size={22} weight={badge.earned ? 'fill' : 'thin'} className="badge-seal-icon" />
            <span className="badge-seal-label">{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
}
