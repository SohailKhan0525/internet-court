import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/** Original vector study: a dark, sculptural gavel on an acid-green field. */
export function GavelScene({ strike }: { strike: number }) {
  const uid = useId().replaceAll(':', '');
  const reduced = useReducedMotion() !== false;
  const play = strike > 0 && !reduced;
  const paint = (name: string) => `url(#${uid}-${name})`;

  return (
    <svg
      className="gavel-scene"
      viewBox="0 0 560 560"
      fill="none"
      role="img"
      aria-labelledby={`${uid}-title ${uid}-description`}
    >
      <title id={`${uid}-title`}>A sculptural judge's gavel</title>
      <desc id={`${uid}-description`}>
        An ink-black gavel hangs above a round sounding block. Fine contours and
        green reflections give the original illustration a carved, dimensional form.
      </desc>

      <defs>
        <linearGradient id={`${uid}-barrel`} x1="210" y1="215" x2="210" y2="327" gradientUnits="userSpaceOnUse">
          <stop stopColor="#75815D" />
          <stop offset=".14" stopColor="#48523A" />
          <stop offset=".42" stopColor="#293222" />
          <stop offset=".78" stopColor="#151D12" />
          <stop offset="1" stopColor="#3D4831" />
        </linearGradient>
        <linearGradient id={`${uid}-handle`} x1="223" y1="160" x2="263" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66734E" />
          <stop offset=".24" stopColor="#475338" />
          <stop offset=".53" stopColor="#222B1C" />
          <stop offset="1" stopColor="#10170D" />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="322" y1="233" x2="379" y2="305" gradientUnits="userSpaceOnUse">
          <stop stopColor="#576545" />
          <stop offset=".5" stopColor="#26331F" />
          <stop offset="1" stopColor="#121D0E" />
        </linearGradient>
        <linearGradient id={`${uid}-left-face`} x1="83" y1="232" x2="132" y2="307" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66764F" />
          <stop offset="1" stopColor="#2D3A21" />
        </linearGradient>
        <linearGradient id={`${uid}-base-side`} x1="277" y1="414" x2="277" y2="478" gradientUnits="userSpaceOnUse">
          <stop stopColor="#465337" />
          <stop offset=".5" stopColor="#25321E" />
          <stop offset="1" stopColor="#182411" />
        </linearGradient>
        <radialGradient id={`${uid}-base-top`} cx="0" cy="0" r="1" gradientTransform="translate(240 416) rotate(11) scale(176 58)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#849262" />
          <stop offset=".6" stopColor="#586B3E" />
          <stop offset="1" stopColor="#344729" />
        </radialGradient>
        <radialGradient id={`${uid}-shadow`} cx="0" cy="0" r="1" gradientTransform="translate(290 481) scale(184 39)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#46552D" stopOpacity=".27" />
          <stop offset="1" stopColor="#46552D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A restrained drafting orbit gives the object room without a backdrop. */}
      <circle cx="280" cy="272" r="215" stroke="#344729" strokeOpacity=".13" />
      <path d="M280 47V61M280 483V497M51 272H65M495 272H509" stroke="#344729" strokeOpacity=".3" />
      <path d="M104 428C147 456 213 474 284 474C361 474 422 456 458 428" stroke="#344729" strokeOpacity=".2" strokeDasharray="3 6" />

      <ellipse cx="290" cy="481" rx="184" ry="39" fill={paint('shadow')} />

      {/* Sounding block: thick edge, concave top, and an understated machined lip. */}
      <path d="M139 422C139 402 200 386 276 386C352 386 413 402 413 422V445C413 466 352 483 276 483C200 483 139 466 139 445V422Z" fill={paint('base-side')} />
      <ellipse cx="276" cy="422" rx="137" ry="36" fill={paint('base-top')} />
      <ellipse cx="276" cy="419" rx="119" ry="28" stroke="#B0C27D" strokeOpacity=".36" />
      <ellipse cx="276" cy="420" rx="109" ry="24" fill="#35482A" fillOpacity=".27" />
      <path d="M147 447C168 466 228 475 277 475C330 475 387 464 405 448" stroke="#6F8450" strokeOpacity=".3" />
      <path d="M143 430C164 447 222 456 276 456C333 456 387 447 410 430" stroke="#A9BD78" strokeOpacity=".23" />

      <motion.g
        key={`impact-${strike}`}
        initial={{ opacity: 0 }}
        animate={play ? { opacity: [0, 0, .5, 0], scale: [.8, .8, 1, 1.2] } : { opacity: 0 }}
        transition={{ duration: .76, times: [0, .4, .62, 1] }}
        style={{ transformOrigin: '276px 415px' }}
      >
        <ellipse cx="276" cy="415" rx="154" ry="46" stroke="#354729" strokeWidth="1.2" />
        <ellipse cx="276" cy="415" rx="170" ry="53" stroke="#354729" strokeWidth=".7" strokeOpacity=".45" />
      </motion.g>

      <motion.g
        key={`gavel-${strike}`}
        initial={{ rotate: 0 }}
        animate={play ? { rotate: [0, 11, -9, -5, 0] } : { rotate: 0 }}
        transition={{ duration: play ? .76 : 0, times: [0, .32, .5, .65, 1], ease: 'easeInOut' }}
        style={{ transformOrigin: '371px 121px' }}
      >
        <g transform="rotate(38 250 270)">
          {/* The narrow, tapered grip meets a turned collar above the head. */}
          <path d="M226 91C225 81 230 73 242 73C254 73 260 81 259 91L253 217C253 229 232 229 232 217L226 91Z" fill={paint('handle')} />
          <path d="M233 93L237 206" stroke="#A8BC7E" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
          <path d="M223 87C223 80 231 74 242 74C253 74 262 80 262 87V100C262 107 253 113 242 113C231 113 223 107 223 100V87Z" fill={paint('handle')} />
          <ellipse cx="242.5" cy="86" rx="19.5" ry="10" fill="#6F7D52" />
          <ellipse cx="242.5" cy="85" rx="14" ry="6" stroke="#A6B97A" strokeOpacity=".36" />
          <path d="M226 99C233 105 251 106 259 100" stroke="#92A36D" strokeOpacity=".35" />
          <path d="M222 214C222 206 232 201 242 201C253 201 263 206 263 214V236H222V214Z" fill={paint('handle')} />
          <ellipse cx="242.5" cy="213" rx="20.5" ry="10" fill="#4B5938" />
          <path d="M223 218C233 226 252 226 263 218" stroke="#99AC70" strokeOpacity=".3" />

          {/* Cylinder's soft reflection and broad end faces carry the silhouette. */}
          <path d="M116 220H348C368 220 384 242 384 270C384 298 368 320 348 320H116C96 320 80 298 80 270C80 242 96 220 116 220Z" fill={paint('barrel')} />
          <ellipse cx="116" cy="270" rx="36" ry="50" fill={paint('left-face')} />
          <ellipse cx="116" cy="270" rx="27" ry="40" stroke="#ACBC86" strokeOpacity=".22" />
          <path d="M117 222H347" stroke="#A1AF7E" strokeOpacity=".46" strokeWidth="1.3" />
          <path d="M151 232H315" stroke="#A3B37F" strokeOpacity=".17" strokeWidth="5" strokeLinecap="round" />
          <path d="M116 317H347" stroke="#8E9F6C" strokeOpacity=".25" />

          {/* Turned bands are dark rings with one finely lit edge. */}
          <path d="M139 220C159 231 159 308 139 320H154C175 306 175 234 154 220H139Z" fill="#182311" />
          <path d="M139 220C159 234 159 306 139 320" stroke="#A6B77F" strokeOpacity=".42" strokeWidth="1.4" />
          <path d="M151 220C171 234 171 306 151 320" stroke="#75875A" strokeOpacity=".45" />
          <path d="M310 220C330 231 330 309 310 320H326C345 308 345 232 326 220H310Z" fill="#172110" />
          <path d="M310 220C330 235 330 306 310 320" stroke="#A9BD7E" strokeOpacity=".38" strokeWidth="1.5" />
          <path d="M323 220C343 234 343 306 323 320" stroke="#6F8252" strokeOpacity=".48" />

          <ellipse cx="348" cy="270" rx="36" ry="50" fill={paint('face')} />
          <ellipse cx="348" cy="270" rx="28" ry="40" stroke="#8FA76B" strokeOpacity=".3" />
          <ellipse cx="348" cy="270" rx="22" ry="33" fill="#182512" fillOpacity=".35" />
          <path d="M330 238C336 230 347 226 355 230" stroke="#BECC9C" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </motion.g>
    </svg>
  );
}
