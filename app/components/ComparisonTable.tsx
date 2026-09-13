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
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#171511] text-[#fffdf7]" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d4ccbd] text-[#bdb5a5]" aria-label="Not included">
        —
      </span>
    );
  }
  return <span>{value}</span>;
}

export default function ComparisonTable({ columns, rows, highlightColumn, caption }: ComparisonTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-x-auto rounded-2xl border border-[#e1d9ca]"
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#e1d9ca]">
            <th className="p-4 font-semibold text-[#5d584d]"> </th>
            {columns.map((column, index) => (
              <th
                key={column}
                className={`p-4 font-semibold ${index === highlightColumn ? 'bg-[#f3eee2] text-[#171511]' : 'text-[#171511]'}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[#ece5d6] last:border-none">
              <th scope="row" className="p-4 font-normal text-[#5d584d]">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={index} className={`p-4 ${index === highlightColumn ? 'bg-[#f3eee2]' : ''}`}>
                  <Cell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <div className="border-t border-[#e1d9ca] p-4 text-sm text-[#766f61]">{caption}</div>}
    </motion.div>
  );
}
