'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export type ComparisonRow = {
  label: string;
  values: (string | boolean)[];
};

type ComparisonTableProps = {
  columns: string[];
  rows: ComparisonRow[];
  highlightColumn?: number;
  caption?: ReactNode;
};

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1a1a] text-[#fdfdfb]" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e4e2dc] text-[#8a8880]" aria-label="Not included">
        —
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function ComparisonTable({ columns, rows, highlightColumn, caption }: ComparisonTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-x-auto rounded border border-[#e4e2dc]"
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e4e2dc]">
            <th className="p-4 font-semibold text-[#4a4a46]"> </th>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`p-4 font-semibold ${index === highlightColumn ? 'bg-[#f8f7f3] text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[#ece9e2] last:border-none">
              <th scope="row" className="p-4 font-normal text-[#4a4a46]">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={index} className={`p-4 ${index === highlightColumn ? 'bg-[#f8f7f3]' : ''}`}>
                  <Cell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <div className="border-t border-[#e4e2dc] p-4 text-sm text-[#6b6b66]">{caption}</div>}
    </motion.div>
  );
}
