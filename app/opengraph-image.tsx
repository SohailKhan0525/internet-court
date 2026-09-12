import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Internet Court — someone is wrong, probably you';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#171511',
          color: '#fffdf7',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 3, color: '#bdb5a5' }}>INTERNET COURT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>Someone is wrong.</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>Probably you.</div>
          <div style={{ fontSize: 30, color: '#d2c9b9', lineHeight: 1.4 }}>
            Put your argument on trial. Let strangers vote. Get a real verdict.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
