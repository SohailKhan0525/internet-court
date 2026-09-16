'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';

type NavLink = { label: string; href: string };

const LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const EASE = [0.32, 0.72, 0, 1] as const;

type SiteNavProps = {
  user: { email?: string | null } | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onStartCase: () => void;
};

export default function SiteNav({ user, onSignIn, onSignOut, onStartCase }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header
        className="fixed left-1/2 top-6 z-50 w-max -translate-x-1/2"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="flex items-center gap-1 rounded-full border border-[#e1d9ca] bg-[#fffdf7]/85 px-2 py-2 shadow-[0_8px_24px_-8px_rgba(23,21,17,0.18)] backdrop-blur-md">
          <a href="/" className="rounded-full px-4 py-2 text-sm font-semibold tracking-tight text-[#171511]">
            INTERNET COURT
          </a>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#ebe4d6]"
          >
            <span className="relative block h-4 w-5">
              <span
                className="absolute left-0 top-0 h-[2px] w-5 origin-center bg-[#171511] transition-transform duration-300"
                style={{ transform: open ? 'translateY(7px) rotate(45deg)' : 'translateY(0) rotate(0deg)' }}
              />
              <span
                className="absolute left-0 top-[7px] h-[2px] w-5 bg-[#171511] transition-opacity duration-150"
                style={{ opacity: open ? 0 : 1 }}
              />
              <span
                className="absolute left-0 top-[14px] h-[2px] w-5 origin-center bg-[#171511] transition-transform duration-300"
                style={{ transform: open ? 'translateY(-7px) rotate(-45deg)' : 'translateY(0) rotate(0deg)' }}
              />
            </span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#171511]/95 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <nav className="flex flex-col items-center gap-2" aria-label="Full site navigation">
              {LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-4xl font-semibold tracking-tight text-[#fffdf7] transition-opacity hover:opacity-70"
                  initial={{ y: 48, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.08 * index }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                className="mt-8 flex flex-col items-center gap-3"
                initial={{ y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.08 * LINKS.length }}
              >
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setOpen(false);
                    onStartCase();
                  }}
                >
                  Start a case <ArrowRight className="btn-icon" weight="bold" size={16} />
                </button>
                {user ? (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#bdb5a5] hover:text-[#fffdf7]"
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#bdb5a5] hover:text-[#fffdf7]"
                    onClick={() => {
                      setOpen(false);
                      onSignIn();
                    }}
                  >
                    Sign in
                  </button>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
