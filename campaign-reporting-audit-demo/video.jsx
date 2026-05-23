/* eslint-disable */
const { useState, useEffect, useRef, useMemo } = React;

const STAGE_W_V = 1440;
const STAGE_H_V = 900;

/* ============================================================
   SCENE 1 — LIVING ORNAMENT (centered, organic, alive)
   Off-white gallery canvas. A botanical ornament grows from
   bottom-center, branches curve outward, leaves appear, red
   flowers bloom at the tips. Proof marks detach and float
   gently into a small folder.
   ============================================================ */

// Centered organic composition.
// Origin point: x=720 (center), y=760 (bottom). Branches go upward and outward.
const BRANCHES = [
  // main central stem
  { d: "M 720,760 C 713,682 727,600 720,520 C 714,440 725,350 720,270",                  len: 500,  delay: 0.00 },
  // left lower branch
  { d: "M 720,640 C 660,610 580,610 500,580 C 430,555 380,520 350,470",                  len: 420,  delay: 0.18 },
  // right lower branch
  { d: "M 720,640 C 780,610 860,610 940,580 C 1010,555 1060,520 1090,470",                len: 420,  delay: 0.22 },
  // left mid branch
  { d: "M 720,500 C 670,470 610,470 560,440 C 510,410 480,360 470,300",                  len: 380,  delay: 0.36 },
  // right mid branch
  { d: "M 720,500 C 770,470 830,470 880,440 C 930,410 960,360 970,300",                  len: 380,  delay: 0.40 },
  // near-centered crown: it grows upright, then leans just enough to feel hand-drawn
  { d: "M 720,270 C 718,258 714,247 708,238",                                               len: 44,   delay: 0.44 },
  // small extra sprigs
  { d: "M 500,580 C 470,570 440,580 420,610",                                              len: 100,  delay: 0.30 },
  { d: "M 940,580 C 970,570 1000,580 1020,610",                                            len: 100,  delay: 0.32 },
];

const LEAVES = [
  // [branchIdx, atFrac (0..1 along branch), scale, rot, mirror, kind]
  { b: 0, at: 0.30, s: 1.1, r: -50, m: false, k: 'leaf' },
  { b: 0, at: 0.55, s: 1.0, r:  40, m: true,  k: 'leaf' },
  { b: 0, at: 0.80, s: 1.0, r: -30, m: false, k: 'leaf' },
  { b: 1, at: 0.30, s: 1.0, r:  20, m: true,  k: 'leaf' },
  { b: 1, at: 0.60, s: 0.9, r: -10, m: false, k: 'leaf' },
  { b: 2, at: 0.30, s: 1.0, r: 160, m: false, k: 'leaf' },
  { b: 2, at: 0.60, s: 0.9, r: 190, m: true,  k: 'leaf' },
  { b: 3, at: 0.45, s: 0.9, r:  10, m: true,  k: 'leaf' },
  { b: 3, at: 0.75, s: 0.8, r: -30, m: false, k: 'leaf' },
  { b: 4, at: 0.45, s: 0.9, r: 170, m: false, k: 'leaf' },
  { b: 4, at: 0.75, s: 0.8, r: 210, m: true,  k: 'leaf' },
  { b: 5, at: 0.48, s: 0.62, r: -38, m: false, k: 'leaf' },
];

// Flower positions (end-of-branch tips). The crown is centered and slightly
// smaller, giving the tree a balanced top without competing with the title.
const FLOWERS = [
  { x: 350,  y: 470, bloomAt: 0.45 },
  { x: 1090, y: 470, bloomAt: 0.48 },
  { x: 470,  y: 300, bloomAt: 0.62 },
  { x: 970,  y: 300, bloomAt: 0.64 },
  { x: 708,  y: 238, bloomAt: 0.49, scale: 0.92 },
];

// Proof marks fall from flowers into a small archival folder bottom-right
const FOLDER_POS = { x: 1300, y: 800 };

const PROOFS = [
  { flowerIdx: 0, type: 'heart',  delay: 0.62 },
  { flowerIdx: 2, type: 'square', delay: 0.66 },
  { flowerIdx: 1, type: 'clip',   delay: 0.70 },
  { flowerIdx: 3, type: 'cam',    delay: 0.74 },
  { flowerIdx: 4, type: 'star',   delay: 0.90 },
  { flowerIdx: 0, type: 'bubble', delay: 0.82 },
  { flowerIdx: 2, type: 'heart',  delay: 0.86 },
];

function Leaf({ x, y, scale, rot, mirror, opacity = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${mirror ? -scale : scale}, ${scale})`} opacity={opacity}>
      <path d="M 0,0 C 12,-18 30,-22 44,-10 C 32,4 14,4 0,0 Z"
        fill="#0a0a0a" stroke="#0a0a0a" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M 4,-2 L 36,-12" stroke="#FAFAF7" strokeWidth="1" opacity="0.55"/>
    </g>
  );
}

function Bloom({ x, y, bloom, scale = 1, hue = 'red', sway = 0, wobbleT = 0 }) {
  if (bloom < 0.01) return null;
  const petals = 6;
  const fill = hue === 'red' ? '#B2342E' : '#0a0a0a';
  // Per-flower wobble — each blossom moves with its own offset so the
  // whole composition feels alive, not rigidly synchronised.
  const seed = (x + y) * 0.013;
  const wobX  = bloom * Math.sin((wobbleT + seed) * Math.PI * 3.0) * 3.5;
  const wobY  = bloom * Math.cos((wobbleT + seed * 1.3) * Math.PI * 2.4) * 2;
  const wobR  = bloom * Math.sin((wobbleT + seed * 1.7) * Math.PI * 2.6) * 4;
  return (
    <g transform={`translate(${x + sway * 3 + wobX}, ${y - sway + wobY}) rotate(${wobR}) scale(${scale})`}>
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * 360) / petals;
        const open = bloom * (0.9 + 0.1 * Math.sin(i * 1.7));
        return (
          <ellipse
            key={i}
            cx="0" cy={-18 * open}
            rx={7 * open} ry={16 * open}
            fill={fill} opacity={0.92 * bloom}
            transform={`rotate(${angle})`}
          />
        );
      })}
      <circle cx="0" cy="0" r={5 * bloom} fill="#0a0a0a"/>
    </g>
  );
}

function MarkSvg({ type, s = 14 }) {
  const sw = 1.8;
  const C = "#0a0a0a";
  switch (type) {
    case 'heart':
      return <path d={`M0,${s*0.85} C${-s*0.95},${s*0.3} ${-s*0.95},${-s*0.6} 0,${-s*0.12} C${s*0.95},${-s*0.6} ${s*0.95},${s*0.3} 0,${s*0.85} Z`}
        fill="none" stroke={C} strokeWidth={sw} strokeLinejoin="round"/>;
    case 'square':
      return <rect x={-s*0.85} y={-s*0.85} width={s*1.7} height={s*1.7} fill="none" stroke={C} strokeWidth={sw}/>;
    case 'clip':
      return <path d={`M${-s*0.5},${s*0.6} L${s*0.5},${-s*0.4} a${s*0.4},${s*0.4} 0 0 1 ${s*0.55},${s*0.55} L${-s*0.2},${s*0.85}`}
        fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round"/>;
    case 'cam':
      return <g fill="none" stroke={C} strokeWidth={sw}>
        <rect x={-s} y={-s*0.65} width={s*2} height={s*1.3}/>
        <circle cx="0" cy="0" r={s*0.48}/>
      </g>;
    case 'bubble':
      return <path d={`M${-s},${-s*0.6} h${s*2} v${s*1.1} h${-s*1.4} l${-s*0.45},${s*0.55} v${-s*0.55} h0 z`}
        fill="none" stroke={C} strokeWidth={sw} strokeLinejoin="round"/>;
    case 'star':
      return <path d={`M0,${-s*0.95} L${s*0.3},${-s*0.3} L${s*0.95},${-s*0.3} L${s*0.42},${s*0.18} L${s*0.6},${s*0.9} L0,${s*0.48} L${-s*0.6},${s*0.9} L${-s*0.42},${s*0.18} L${-s*0.95},${-s*0.3} L${-s*0.3},${-s*0.3} Z`}
        fill="none" stroke={C} strokeWidth={sw} strokeLinejoin="round"/>;
    default:
      return <circle r={s*0.6} fill={C}/>;
  }
}

function Folder({ x, y, count, total }) {
  const ratio = total > 0 ? count / total : 0;
  return (
    <g transform={`translate(${x - 95}, ${y - 90})`}>
      <path d="M 0,15 L 50,15 L 64,2 L 178,2 L 178,118 L 0,118 Z"
        fill="#FAFAF7" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="10" y={118 - 90 * ratio - 6} width="158" height={90 * ratio} fill="#0a0a0a" opacity="0.10"/>
      <text x="89" y="140" fontSize="10" fontWeight="900" textAnchor="middle" fill="#0a0a0a" letterSpacing="3" fontFamily="Helvetica, Arial, sans-serif">
        PROOFS · {String(count).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </text>
    </g>
  );
}

function Branch({ d, len, drawT }) {
  const offset = len * (1 - Math.max(0, Math.min(1, drawT)));
  return (
    <path d={d} stroke="#0a0a0a" strokeWidth="2.2" fill="none"
      strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={len} strokeDashoffset={offset}/>
  );
}

function SceneDrawing({ t }) {
  // For each leaf along a branch, we need to look up a point along that path.
  const branchRefs = useRef([]);
  const [leafPositions, setLeafPositions] = useState([]);

  useEffect(() => {
    const positions = LEAVES.map((l) => {
      const path = branchRefs.current[l.b];
      if (!path) return null;
      try {
        const totalLen = path.getTotalLength();
        return path.getPointAtLength(totalLen * l.at);
      } catch (e) { return null; }
    });
    setLeafPositions(positions);
  }, []);

  // A restrained breath keeps the linework alive without distorting its shape.
  const swayPhase = Math.max(0, Math.min(1, (t - 0.40) * 2));
  const sway = swayPhase * Math.sin(t * Math.PI * 3.0);

  return (
    <div className="scene s-drawing">
      <svg viewBox={`0 0 ${STAGE_W_V} ${STAGE_H_V}`} className="draw-svg" preserveAspectRatio="xMidYMid meet">
        <rect width={STAGE_W_V} height={STAGE_H_V} fill="#FAFAF7"/>

        {/* gallery corner marks */}
        <g stroke="#0a0a0a" strokeWidth="1" opacity="0.18">
          <line x1="40" y1="40" x2="40" y2="60"/><line x1="40" y1="40" x2="60" y2="40"/>
          <line x1={STAGE_W_V - 40} y1="40" x2={STAGE_W_V - 40} y2="60"/><line x1={STAGE_W_V - 60} y1="40" x2={STAGE_W_V - 40} y2="40"/>
          <line x1="40" y1={STAGE_H_V - 60} x2="40" y2={STAGE_H_V - 40}/><line x1="40" y1={STAGE_H_V - 40} x2="60" y2={STAGE_H_V - 40}/>
          <line x1={STAGE_W_V - 40} y1={STAGE_H_V - 60} x2={STAGE_W_V - 40} y2={STAGE_H_V - 40}/><line x1={STAGE_W_V - 60} y1={STAGE_H_V - 40} x2={STAGE_W_V - 40} y2={STAGE_H_V - 40}/>
        </g>

        {/* archival caption */}
        <text x="60" y={STAGE_H_V - 60} fontSize="10" fontWeight="800" fontFamily="Helvetica, Arial, sans-serif" letterSpacing="3" fill="#0a0a0a" opacity="0.5">● 01 / 05 — A LIVING PROCESS</text>
        <text x={STAGE_W_V - 60} y="56" fontSize="10" fontWeight="800" fontFamily="Helvetica, Arial, sans-serif" letterSpacing="3" fill="#0a0a0a" opacity="0.5" textAnchor="end">VORTEK.TECH — CAMPAIGN.OS</text>

        {/* breathing group */}
        <g transform={`translate(${sway * 4}, ${sway * 1.5}) rotate(${sway * 0.5} 720 760)`}>

          {/* branches — each draws itself */}
          {BRANCHES.map((br, i) => {
            const local = Math.max(0, Math.min(1, (t - br.delay) * 2.6));
            return (
              <g key={i} ref={(el) => {
                // capture the path ref from inside group
                if (el) {
                  const path = el.querySelector('path');
                  if (path) branchRefs.current[i] = path;
                }
              }}>
                <Branch d={br.d} len={br.len} drawT={local}/>
              </g>
            );
          })}

          {/* leaves — pop in as branches reach them */}
          {LEAVES.map((l, i) => {
            const pos = leafPositions[i];
            if (!pos) return null;
            const branchProgress = Math.max(0, Math.min(1, (t - BRANCHES[l.b].delay) * 2.6));
            if (branchProgress < l.at) return null;
            const leafBloom = Math.max(0, Math.min(1, (branchProgress - l.at) * 5));
            return (
              <Leaf key={i} x={pos.x} y={pos.y}
                scale={l.s * leafBloom} rot={l.r} mirror={l.m}
                opacity={leafBloom}
              />
            );
          })}

          {/* flowers — each wobbles independently */}
          {FLOWERS.map((f, i) => {
            const bloom = Math.max(0, Math.min(1, (t - f.bloomAt) * 3));
            return <Bloom key={i} x={f.x} y={f.y} bloom={bloom} scale={f.scale || 1} sway={sway} wobbleT={t}/>;
          })}

          {/* base soil line */}
          <line x1="540" y1="760" x2="900" y2="760" stroke="#0a0a0a" strokeWidth="1.6"/>
        </g>
      </svg>

      <div className="draw-text">
        <div className={`dt-eyebrow ${t > 0.02 ? 'in' : ''}`}>● A LIVING PROCESS</div>
        <div className="dt-headline-wrap">
          <div className={`dt-h1 ${t > 0.08 ? 'in' : ''}`}>WHILE YOU MAKE THE <em>ART</em></div>
          <div className={`dt-h2 ${t > 0.55 ? 'in' : ''}`}>WE COLLECT <span className="red">THE PROOF</span></div>
        </div>
      </div>
    </div>
  );
}

// (old MARKS array removed — replaced by PROOFS above)

// (helpers moved into the new SceneDrawing definition above)

// (Flower / Leaf helpers now defined above)

// (ProofFolder helper merged into SceneDrawing above as Folder)

// (old SceneDrawing body replaced by the new centered-ornament version above)


/* ============================================================
   SCENE 2 — SOLUTION TITLE
   ============================================================ */
function SceneSolution({ t }) {
  return (
    <div className="scene s-solution">
      <div className={`sol-eyebrow ${t > 0.05 ? 'in' : ''}`}>● BY VORTEK.TECH</div>
      <h1 className={`sol-title ${t > 0.15 ? 'in' : ''}`}>campaign.os</h1>
      <div className={`sol-rule ${t > 0.30 ? 'in' : ''}`} />
      <div className={`sol-sub ${t > 0.35 ? 'in' : ''}`}>
        ONE LAYER FOR<br />
        CAMPAIGN PROOF<br />
        &amp; CLIENT REPORTING
      </div>
      <div className={`sol-meta ${t > 0.65 ? 'in' : ''}`}>
        <span>BRIEF</span><span>→</span>
        <span>DELIVERABLES</span><span>→</span>
        <span>PROOF</span><span>→</span>
        <span>STATUS</span><span>→</span>
        <span>CLIENT UPDATE</span>
      </div>
    </div>
  );
}

/* ============================================================
   SCENE 2 — PROMISES (selling, on brand)
   Off-white gallery. Three uppercase punches stack.
   ============================================================ */
function ScenePromises({ t }) {
  const lines = [
    { txt: <>STOP <span className="red">LOSING</span> PROOFS</>,           at: 0.05, out: 0.95 },
    { txt: <>STOP RECONSTRUCTING REPORTS</>,                                at: 0.30, out: 0.95 },
    { txt: <>EVERYTHING ONE PLACE <span className="red">AUTO</span></>,     at: 0.58, out: 0.95 },
  ];
  return (
    <div className="scene s-promises">
      <div className={`prom-eyebrow ${t > 0.02 ? 'in' : ''}`}>● VORTEK.TECH · CAMPAIGN.OS</div>
      <div className="prom-stack">
        {lines.map((l, i) => {
          const state = t > l.out ? 'out' : t > l.at ? 'in' : 'pre';
          return (
            <div key={i} className={`prom-line ${state}`}>
              <span className="prom-mask"><span className="prom-inner">{l.txt}</span></span>
            </div>
          );
        })}
      </div>
      <div className={`prom-foot ${t > 0.85 ? 'in' : ''}`}>PROOF COLLECTED FOR YOU</div>
    </div>
  );
}

/* ============================================================
   SCENE 3 — TOOLS converge into a PACKAGE (folder)
   Real-looking monochrome silhouettes, drop into one box on right.
   ============================================================ */

const ToolIcons = {
  Sheets: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 3 H21 L26 8 V29 H6 Z"/>
      <path d="M21 3 V8 H26"/>
      <rect x="9" y="14" width="14" height="11"/>
      <line x1="9" y1="18" x2="23" y2="18"/>
      <line x1="9" y1="21.5" x2="23" y2="21.5"/>
      <line x1="16" y1="14" x2="16" y2="25"/>
    </svg>
  ),
  Drive: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 4 L20 4 L29 20 L25 27 L7 27 L3 20 Z"/>
      <line x1="12" y1="4" x2="7" y2="20"/>
      <line x1="20" y1="4" x2="25" y2="27"/>
      <line x1="7" y1="20" x2="29" y2="20"/>
    </svg>
  ),
  Slack: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <rect x="18"  y="3"  width="4" height="13" rx="2"/>
      <rect x="16"  y="18" width="13" height="4" rx="2"/>
      <rect x="10"  y="16" width="4" height="13" rx="2"/>
      <rect x="3"   y="10" width="13" height="4" rx="2"/>
    </svg>
  ),
  Notion: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="4" y="3" width="24" height="26"/>
      <path d="M10 23 V9 L22 22 V9" strokeWidth="2.2"/>
    </svg>
  ),
  Airtable: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M16 4 L4 9 L16 14 L28 9 Z"/>
      <path d="M4 12 V22 L14 27 V17 Z"/>
      <path d="M28 12 V22 L18 27 V17 Z" opacity="0.75"/>
      <rect x="22" y="14" width="3" height="7" fill="#0a0a0a"/>
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="24" height="24" rx="6"/>
      <circle cx="16" cy="16" r="6"/>
      <circle cx="23" cy="9" r="1.4" fill="currentColor"/>
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 32 32" fill="currentColor">
      <path d="M19 4 V20 a6 6 0 1 1 -6 -6 v4 a2 2 0 1 0 2 2 V4 Z"/>
      <path d="M19 4 H23 a6 6 0 0 0 6 6 V14 a10 10 0 0 1 -10 -10 Z" opacity="0.5"/>
    </svg>
  ),
  Gmail: (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 9 V26 H29 V9"/>
      <path d="M3 9 L16 19 L29 9"/>
      <path d="M3 9 L3 6 L8 6 L16 13 L24 6 L29 6 L29 9" fill="currentColor" stroke="none" opacity="0.18"/>
    </svg>
  ),
};

const TOOLS = [
  { id: 'Sheets',    n: 'GOOGLE SHEETS' },
  { id: 'Drive',     n: 'GOOGLE DRIVE' },
  { id: 'Slack',     n: 'SLACK' },
  { id: 'Notion',    n: 'NOTION' },
  { id: 'Airtable',  n: 'AIRTABLE' },
  { id: 'Instagram', n: 'INSTAGRAM' },
  { id: 'TikTok',    n: 'TIKTOK' },
  { id: 'Gmail',     n: 'GMAIL' },
];

// Edge-based starting positions — ALL outside the left text column (x > 720)
// so logos never overlap the headline on the left.
const TOOL_ORIGIN = [
  { x: 1100, y: -140, r: -10 },
  { x: 1560, y:  140, r:   8 },
  { x: 1620, y:  380, r:  -6 },
  { x: 1580, y:  680, r:  10 },
  { x: 1300, y: 1040, r:   5 },
  { x:  920, y: 1020, r:  -8 },
  { x:  820, y: -120, r:  -4 },
  { x: 1500, y: -100, r:   6 },
];

// Stacked target inside the package on the right.
// Box opening centered around (1180, 470). Each tool drops slightly offset.
const PACKAGE_CENTER = { x: 1170, y: 480 };
const STACK = [
  { dx:  -38, dy:  -52, r: -6 },
  { dx:   38, dy:  -36, r:  4 },
  { dx:  -22, dy:  -10, r:  3 },
  { dx:   30, dy:    4, r: -5 },
  { dx:  -42, dy:   28, r:  2 },
  { dx:   26, dy:   42, r: -3 },
  { dx:    0, dy:    0, r:  0 },
  { dx:   -8, dy:   58, r:  6 },
];

function PackageBox({ flap }) {
  const cx = PACKAGE_CENTER.x;
  const cy = PACKAGE_CENTER.y;
  const w = 240, h = 220;
  const left = cx - w / 2, top = cy - h / 2;
  const flapAngle = -85 * (1 - flap); // -85deg closed-down (open up), 0 closed
  return (
    <svg viewBox={`0 0 ${STAGE_W_V} ${STAGE_H_V}`} className="pkg-svg">
      <g>
        {/* back of package */}
        <rect x={left} y={top} width={w} height={h} fill="#FAFAF7" stroke="#0a0a0a" strokeWidth="1.8"/>
        {/* tape strip */}
        <line x1={left} y1={top + h / 2} x2={left + w} y2={top + h / 2} stroke="#0a0a0a" strokeWidth="1" strokeDasharray="6 5" opacity="0.35"/>
        {/* label */}
        <g transform={`translate(${left + 18}, ${top + h - 68})`}>
          <rect x="0" y="0" width="108" height="24" fill="#FAFAF7" stroke="#0a0a0a" strokeWidth="1.2"/>
          <text x="54" y="16" textAnchor="middle" fontSize="11" fontWeight="900" letterSpacing="3" fontFamily="Helvetica, Arial, sans-serif" fill="#0a0a0a">CAMPAIGN.OS</text>
        </g>
        <text x={left + 18} y={top + h - 22} fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="Helvetica, Arial, sans-serif" fill="#0a0a0a" opacity="0.5">▸ ALL TOOLS · ONE LAYER</text>
        {/* front flap (animates open) */}
        <g style={{ transformBox: 'fill-box', transformOrigin: `${left + w / 2}px ${top}px`, transform: `rotate(${flapAngle}deg)` }}>
          <path d={`M ${left} ${top} L ${left + w / 2} ${top - 18} L ${left + w} ${top} L ${left + w - 30} ${top + 70} L ${left + 30} ${top + 70} Z`}
            fill="#F4F3EF" stroke="#0a0a0a" strokeWidth="1.6" strokeLinejoin="round"/>
          <line x1={left + w / 2} y1={top - 18} x2={left + w / 2} y2={top + 60} stroke="#0a0a0a" strokeWidth="1" opacity="0.35"/>
        </g>
      </g>
    </svg>
  );
}

function SceneTools({ t }) {
  // 0–0.45 enter; 0.45–0.92 fly to package; 0.92–1.0 settle
  const enter = Math.max(0, Math.min(1, (t - 0.05) / 0.35));
  const flap  = Math.max(0, Math.min(1, (t - 0.50) / 0.10));
  const labelOn = t > 0.92;

  return (
    <div className="scene s-tools">
      <PackageBox flap={Math.max(0, 1 - Math.max(0, Math.min(1, (t - 0.55) / 0.37)) * 1.2)} />

      <div className="tools-left">
        <div className={`tools-eyebrow ${t > 0.04 ? 'in' : ''}`}>● VORTEK.TECH</div>
        <h2 className={`tools-headline ${t > 0.08 ? 'in' : ''}`}>
          <span className="tw-row"><span className="tw-mask"><span>EVERY</span></span></span>
          <span className="tw-row"><span className="tw-mask" style={{ transitionDelay: '0.10s' }}><span>TOOL IN</span></span></span>
          <span className="tw-row"><span className="tw-mask" style={{ transitionDelay: '0.20s' }}><span><i className="red">ONE</i></span></span></span>
          <span className="tw-row"><span className="tw-mask" style={{ transitionDelay: '0.30s' }}><span>PACKAGE</span></span></span>
        </h2>
        <div className={`tools-sub ${t > 0.22 ? 'in' : ''}`}>
          SHEETS · DRIVE · SLACK · NOTION<br />
          AIRTABLE · INSTAGRAM · TIKTOK · GMAIL
        </div>
      </div>

      <div className="tools-layer">
        {TOOLS.map((tool, i) => {
          const origin = TOOL_ORIGIN[i];
          const stack = STACK[i];
          const target = { x: PACKAGE_CENTER.x + stack.dx, y: PACKAGE_CENTER.y + stack.dy, r: stack.r };
          const personalFlyT = Math.max(0, Math.min(1, (t - 0.55 - i * 0.025) / 0.32));
          const easeFly = personalFlyT > 0 ? (1 - Math.pow(1 - personalFlyT, 3)) : 0;

          const entryEase = 1 - Math.pow(1 - enter, 2.5);
          const startX = origin.x + (origin.x > STAGE_W_V / 2 ? 220 : -220);
          const startY = origin.y + (origin.y < 0 ? -140 : origin.y > STAGE_H_V ? 140 : 0);
          const restX = origin.x;
          const restY = origin.y;

          const beforeFlyX = startX + (restX - startX) * entryEase;
          const beforeFlyY = startY + (restY - startY) * entryEase;

          // Curved arc on the way to the package (parabolic offset along the curve)
          const arcMag = 120;
          const arcOffsetY = Math.sin(easeFly * Math.PI) * -arcMag;
          const x = beforeFlyX + (target.x - beforeFlyX) * easeFly;
          const y = beforeFlyY + (target.y - beforeFlyY) * easeFly + arcOffsetY * (easeFly < 0.5 ? easeFly * 2 : (1 - easeFly) * 2);
          // Rotation while flying: spins as it travels, lands at stack rotation
          const flyRotation = origin.r + (easeFly < 0.85 ? easeFly * 220 : 220 + (easeFly - 0.85) / 0.15 * (target.r - 220));
          const settleR = easeFly > 0.85 ? target.r : flyRotation;
          const scale = 1 - easeFly * 0.32;
          const opacity = entryEase * (easeFly > 0.95 ? Math.max(0, 1 - (easeFly - 0.95) * 6) : 1);
          const visible = t > 0.02 + i * 0.04;
          const trailing = easeFly > 0.05 && easeFly < 0.85;

          return (
            <React.Fragment key={tool.id}>
              {trailing && (
                <div
                  className="tool-trail"
                  style={{
                    transform: `translate(${x - 64 - 14}px, ${y - 56 - 8}px) rotate(${settleR}deg) scale(${scale * 1.06})`,
                    opacity: opacity * 0.22,
                    zIndex: 9 + i,
                  }}
                />
              )}
              <div
                className={`tool-plate ${visible ? 'in' : ''}`}
                style={{
                  transform: `translate(${x - 64}px, ${y - 56}px) rotate(${settleR}deg) scale(${scale})`,
                  opacity,
                  zIndex: 10 + i,
                }}
              >
                <div className="tp-ic">{ToolIcons[tool.id]}</div>
                <div className="tp-n">{tool.n}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className={`pkg-caption ${labelOn ? 'in' : ''}`}>
        ▸ EIGHT TOOLS · ONE LAYER · ZERO COPY-PASTE
      </div>
    </div>
  );
}

/* ============================================================
   SCENE 4 — DASHBOARD (uses window.Dashboard)
   ============================================================ */
function SceneDashboard({ active, speed }) {
  // Mount Dashboard fresh when scene becomes active so script restarts.
  return active ? <window.Dashboard playing={true} speed={speed} /> : null;
}

/* ============================================================
   SCENE 5 — FINAL CTA
   ============================================================ */
function SceneCTA({ t, onReplay }) {
  return (
    <div className="scene s-cta">
      <div className={`cta-frame-top ${t > 0.05 ? 'in' : ''}`}>
        <span>VORTEK.TECH</span>
        <span className="sep">/</span>
        <span>campaign.os</span>
      </div>

      <div className={`cta-eyebrow ${t > 0.12 ? 'in' : ''}`}>● FIRST OFFER</div>
      <h1 className={`cta-title ${t > 0.18 ? 'in' : ''}`}>
        REQUEST<br />
        CAMPAIGN<br />
        REPORTING<br />
        &amp; PROOF AUDIT
      </h1>
      <div className={`cta-rule ${t > 0.32 ? 'in' : ''}`} />
      <div className={`cta-sub ${t > 0.36 ? 'in' : ''}`}>
        A PAID AUDIT OF ONE REAL CAMPAIGN.<br />
        BUILT ON YOUR STACK · 5–7 DAYS · BY VORTEK.TECH
      </div>

      <div className={`cta-actions ${t > 0.5 ? 'in' : ''}`}>
        <a className="cta-btn-primary" href="#" onClick={(e) => e.preventDefault()}>
          REQUEST AUDIT <span className="arr">↗</span>
        </a>
        <button className="cta-btn-secondary" onClick={onReplay}>
          REPLAY VIDEO
        </button>
      </div>

      <div className={`cta-meta-row ${t > 0.7 ? 'in' : ''}`}>
        <div><b>01</b><span>PROOF MAP</span></div>
        <div><b>02</b><span>REPORTING MAP</span></div>
        <div><b>03</b><span>AI AGENT PLAN</span></div>
      </div>
    </div>
  );
}

/* ============================================================
   ORCHESTRATOR
   ============================================================ */

const SCENES = [
  { id: 'drawing',   dur: 9000,  Comp: SceneDrawing },
  { id: 'promises',  dur: 4800,  Comp: ScenePromises },
  { id: 'tools',     dur: 7400,  Comp: SceneTools },
  { id: 'dashboard', dur: 17300, Comp: SceneDashboard },
  { id: 'cta',       dur: 7000,  Comp: SceneCTA },
];

const TWEAK_DEFAULTS_V = /*EDITMODE-BEGIN*/{
  "speed": 1,
  "autoplay": false,
  "loop": false
}/*EDITMODE-END*/;

function Video() {
  const [tweaks, setTweaks] = useTweaks(TWEAK_DEFAULTS_V);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [t, setT] = useState(tweaks.autoplay ? 0 : 0.46);
  const [playing, setPlaying] = useState(!!tweaks.autoplay);
  const [started, setStarted] = useState(!!tweaks.autoplay);

  const wrapRef = useRef(null);
  const stageRef = useRef(null);

  // Fit stage
  useEffect(() => {
    const fit = () => {
      if (!wrapRef.current || !stageRef.current) return;
      const W = wrapRef.current.clientWidth;
      const H = wrapRef.current.clientHeight;
      const s = Math.min(W / STAGE_W_V, H / STAGE_H_V);
      stageRef.current.style.transform = `scale(${s}) translate(-50%, -50%)`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Per-scene RAF timer
  useEffect(() => {
    if (!playing) return;
    let startTs = null;
    let raf;
    const speed = tweaks.speed || 1;
    const dur = SCENES[sceneIdx].dur / speed;
    const progressAtPlay = t;
    const tick = (now) => {
      if (startTs == null) startTs = now;
      const elapsed = (now - startTs) + progressAtPlay * dur;
      const nt = Math.min(1, elapsed / dur);
      setT(nt);
      if (nt < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // Advance
        if (sceneIdx + 1 < SCENES.length) {
          setSceneIdx(i => i + 1);
          setT(0);
        } else if (tweaks.loop) {
          setSceneIdx(0); setT(0);
        } else {
          setPlaying(false);
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneIdx, playing, tweaks.speed, tweaks.loop]);

  // Reset t when scene changes (cleanup)
  const replay = () => { setStarted(true); setSceneIdx(0); setT(0); setPlaying(true); };
  const skipToScene = (i) => { setStarted(true); setSceneIdx(i); setT(0); setPlaying(true); };

  const totalDur = SCENES.reduce((a, s) => a + s.dur, 0);
  const elapsedBefore = SCENES.slice(0, sceneIdx).reduce((a, s) => a + s.dur, 0);
  const globalElapsed = elapsedBefore + t * SCENES[sceneIdx].dur;
  const globalT = globalElapsed / totalDur;
  const showTweaks = new URLSearchParams(window.location.search).has('edit');

  return (
    <>
      <div className="stage-wrap" ref={wrapRef}>
        <div className="stage" ref={stageRef}>
          {/* Seamless transitions: all scenes stacked vertically, camera pans down */}
          <div
            className="scenes-strip"
            style={{ transform: `translateY(${-sceneIdx * 100}%)` }}
          >
            {SCENES.map((s, i) => {
              const Comp = s.Comp;
              const sceneT = i < sceneIdx ? 1 : i > sceneIdx ? 0 : t;
              const inRange = Math.abs(i - sceneIdx) <= 1;
              return (
                <div
                  key={i}
                  className="scene-slot"
                  data-screen-label={`0${i + 1} ${s.id}`}
                  style={{ top: `${i * 100}%` }}
                >
                  {inRange && <Comp t={sceneT} active={i === sceneIdx} speed={tweaks.speed || 1} onReplay={replay} />}
                </div>
              );
            })}
          </div>

          {/* Bottom-right floating controls */}
          <div className="v-controls">
            <button className="v-ctl primary" onClick={() => started ? setPlaying(p => !p) : replay()} title="Play/Pause">
              {playing ? (
                <svg viewBox="0 0 12 12" fill="currentColor"><rect x="3" y="2.5" width="2" height="7" /><rect x="7" y="2.5" width="2" height="7" /></svg>
              ) : (
                <svg viewBox="0 0 12 12" fill="currentColor"><path d="M3 2L10 6L3 10Z" /></svg>
              )}
            </button>
            <button className="v-ctl" onClick={replay} title="Replay">
              <svg viewBox="0 0 12 12" fill="none"><path d="M2 6a4 4 0 1 0 4-4M2 6V3M2 6h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
            <div className="v-progress">
              {SCENES.map((s, i) => (
                <div key={i} className={`vp-tick ${i === sceneIdx ? 'on' : ''} ${i < sceneIdx ? 'done' : ''}`} onClick={() => skipToScene(i)} title={s.id}>
                  <div className="vp-fill" style={{ width: i < sceneIdx ? '100%' : i === sceneIdx ? `${t * 100}%` : '0%' }} />
                </div>
              ))}
            </div>
            <div className="v-time">{Math.floor(globalElapsed / 1000)}s / {Math.floor(totalDur / 1000)}s</div>
          </div>
        </div>
      </div>

      {showTweaks && <TweaksPanel title="Tweaks">
        <TweakSection title="Playback">
          <TweakSlider label="Speed" value={tweaks.speed} min={0.5} max={2} step={0.1}
            onChange={(v) => setTweaks('speed', v)} />
          <TweakToggle label="Autoplay" value={tweaks.autoplay}
            onChange={(v) => setTweaks('autoplay', v)} />
          <TweakToggle label="Loop video" value={tweaks.loop}
            onChange={(v) => setTweaks('loop', v)} />
        </TweakSection>
        <TweakSection title="Scenes">
          {SCENES.map((s, i) => (
            <TweakButton key={i} onClick={() => skipToScene(i)}>
              {String(i + 1).padStart(2, '0')} · {s.id}
            </TweakButton>
          ))}
          <TweakButton onClick={replay}>Replay full video</TweakButton>
        </TweakSection>
      </TweaksPanel>}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Video />);
