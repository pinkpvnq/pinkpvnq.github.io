/* eslint-disable */
const { useState, useEffect, useRef, useMemo, useLayoutEffect } = React;

/* ============================================================
   campaign.os — interactive walkthrough demo
   One dashboard, animated 10-step product walkthrough
   ============================================================ */

const STAGE_W = 1440;
const STAGE_H = 900;

// Static fallback positions for targets without a DOM element.
// All real UI targets are looked up live via [data-cursor-target="..."]
// inside a useLayoutEffect, so they always land on the actual element.
const POS = {
  rest: [1140, 760],
  off:  [1300, 820],
};

const SCRIPT = [
  { dur: 1100, target: 'rest' },
  { dur:  900, target: 'missingPlate' },
  { dur:  300, target: 'missingPlate', click: true, set: { filter: 'missing', highlight: 'missingPlate' } },
  { dur: 1200, target: 'missingPlate' },
  { dur:  900, target: 'julesRow' },
  { dur:  300, target: 'julesRow', click: true, set: { detailOpen: true, selected: 'julespark', highlight: 'julesRow' } },
  { dur: 1800, target: 'julesRow' },
  { dur:  800, target: 'generateBtn' },
  { dur:  300, target: 'generateBtn', click: true, set: { aiState: 'typing', highlight: 'generateBtn' } },
  { dur: 1700, target: 'generateBtn' },
  { dur:    0, target: 'generateBtn', set: { aiState: 'draft' } },
  { dur: 1600, target: 'generateBtn' },
  { dur:  700, target: 'addUpdateBtn' },
  { dur:  300, target: 'addUpdateBtn', click: true, set: { aiState: 'added', readiness: 82, toast: true, highlight: 'addUpdateBtn' } },
  { dur: 1500, target: 'watchRing' },
  { dur:    0, target: 'watchRing', set: { toast: false, ctaShown: true } },
  { dur: 4500, target: 'off' },
];

function deriveState(idx) {
  const base = {
    filter: 'all',
    detailOpen: false,
    selected: null,
    aiState: 'idle', // idle | typing | draft | added
    readiness: 68,
    toast: false,
    ctaShown: false,
    highlight: null,
  };
  for (let i = 0; i <= idx && i < SCRIPT.length; i++) {
    if (SCRIPT[i].set) Object.assign(base, SCRIPT[i].set);
  }
  // highlight is transient — only persists for current and the next step
  if (idx >= 0) {
    const cur = SCRIPT[idx];
    if (!cur?.set?.highlight) base.highlight = null;
  }
  return base;
}

/* ---------- Cursor & click pulse ---------- */
function Cursor({ x, y }) {
  return (
    <div className="cursor" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M3 2 L3 18 L8 14 L11 21 L14 20 L11 13 L18 13 Z" fill="#090909" stroke="#FAFAF7" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function ClickPulse({ x, y, k }) {
  return <div key={k} className="click-fx" style={{ left: x + 4, top: y + 4 }} />;
}

/* ---------- Topbar ---------- */
function Topbar() {
  return (
    <div className="topbar">
      <div className="brand-mark">VORTEK.TECH</div>
      <div className="brand-sep" />
      <div className="product">campaign.os</div>
      <div className="nav">
        <a>Proof System</a>
        <a className="on">Campaigns</a>
        <a>Built For</a>
        <a>Audit</a>
        <a>Agents</a>
      </div>
      <div className="right">
        <span className="live">Live · auto-syncing</span>
        <button className="btn-req">Request audit</button>
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="side-product">
        <div className="pl">Product</div>
        <div className="pn">campaign.os</div>
        <div className="pb">by Vortek.Tech</div>
      </div>

      <div className="side-section">
        <h4>Workspace</h4>
        <div className="side-item"><span className="marker">◇</span>Overview<span className="num">3</span></div>
        <div className="side-item active"><span className="marker">●</span>Campaigns<span className="num">2</span></div>
        <div className="side-item"><span className="marker">◇</span>Creators<span className="num">42</span></div>
        <div className="side-item"><span className="marker">◇</span>Proof Library<span className="num">118</span></div>
        <div className="side-item"><span className="marker">◇</span>Client Updates<span className="num">1</span></div>
      </div>

      <div className="side-section">
        <h4>Clients</h4>
        <div className="side-item"><span className="marker">▸</span>GlowHaus<span className="num">2</span></div>
        <div className="side-item"><span className="marker">▸</span>Mirae Studio<span className="num">1</span></div>
        <div className="side-item"><span className="marker">▸</span>House of Lune</div>
      </div>

      <div className="side-foot">
        <b>Account Lead</b><br />
        boutique · 4 seats
      </div>
    </aside>
  );
}

/* ---------- Main ---------- */
const ALL_ROWS = [
  { id: 'maya',     handle: '@mayaevans',     av: 'MA', deliverable: 'IG Story x2', proof: 'Screenshot captured', proofCls: '', date: 'Jun 12', tag: 'complete', tagLbl: 'Complete', status: 'complete' },
  { id: 'jules',    handle: '@julespark',     av: 'JP', deliverable: 'TikTok Video', proof: 'Link missing', proofCls: 'miss', date: 'Jun 14', tag: 'followup', tagLbl: 'Follow-up', status: 'followup' },
  { id: 'beauty',   handle: '@thebeautyedit', av: 'BE', deliverable: 'Reel', proof: 'Awaiting approval', proofCls: 'pend', date: 'Jun 15', tag: 'pending', tagLbl: 'Pending', status: 'pending' },
  { id: 'sarah',    handle: '@sarahglow',     av: 'SG', deliverable: 'IG Post', proof: 'Metrics captured', proofCls: '', date: 'Jun 17', tag: 'complete', tagLbl: 'Complete', status: 'complete' },
  { id: 'kira',     handle: '@kira.kim',      av: 'KK', deliverable: 'IG Story', proof: 'Missing', proofCls: 'miss', date: 'Jun 18', tag: 'followup', tagLbl: 'Follow-up', status: 'followup' },
  { id: 'noah',     handle: '@noahray',       av: 'NR', deliverable: 'IG Carousel', proof: 'Metrics captured', proofCls: '', date: 'Jun 18', tag: 'complete', tagLbl: 'Complete', status: 'complete' },
];

function Main({ state }) {
  const ringPct = state.readiness;
  const C = 2 * Math.PI * 38;

  const filtered = state.filter === 'missing'
    ? ALL_ROWS.filter(r => r.proofCls === 'miss' || r.status === 'followup')
    : ALL_ROWS;

  return (
    <div className="main">
      <div className="main-head">
        <div>
          <div className="crumb-row">
            <span>Campaign Proof</span>
            <span className="sep">/</span>
            <span className="crumb">GlowHaus / Summer Launch</span>
          </div>
          <h1>Campaign Proof &amp; Client Update Layer
            <small>Live operational hub · 42 creators · 5 deliverable types</small>
          </h1>
        </div>
        <div className="head-meta">
          <span className="head-pill">W12 · auto-sync</span>
          <button className="btn-secondary">Export</button>
          <button className="btn-share">Share report ↗</button>
        </div>
      </div>

      {/* Stat plates */}
      <div className="stats">
        <div data-cursor-target="watchRing" className={`plate ring-plate ${state.highlight === 'watchRing' ? 'is-target' : ''}`}>
          <div className="ring">
            <svg viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(9,9,9,0.12)" strokeWidth="6" />
              <circle className="fill" cx="44" cy="44" r="38" fill="none" stroke="#090909" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(ringPct / 100) * C} ${C}`} />
            </svg>
            <div className="v">{ringPct}<small>%</small></div>
          </div>
          <div className="meta">
            <b>Report readiness</b><br />
            17 proofs / 9 approvals pending
            <div className="delta-row">↑ +14% after AI sync</div>
          </div>
        </div>

        <div className="plate">
          <div className="lbl">Creators tracked</div>
          <div className="num">42</div>
          <div className="sub">+6 this week</div>
        </div>
        <div className="plate">
          <div className="lbl">Proofs collected</div>
          <div className="num">118</div>
          <div className="sub">+24 today · matched auto</div>
        </div>
        <div data-cursor-target="missingPlate" className={`plate signal ${state.highlight === 'missingPlate' ? 'is-target' : ''}`}>
          <div className="lbl">Missing items</div>
          <div className="num">17</div>
          <div className="sub" style={{ color: 'var(--signal)' }}>9 stories · 6 links · 2 metrics</div>
        </div>
        <div className="plate warn">
          <div className="lbl">Approvals pending</div>
          <div className="num">09</div>
          <div className="sub">avg wait · 3.2 days</div>
        </div>
      </div>

      {/* Body grid */}
      <div className="body">
        {/* Deliverables */}
        <section className="frame">
          <div className="frame-h">
            <div className="ttl"><span className="red">●</span>Creator Deliverables</div>
            <div className="meta-tabs">
              <span className={`tab ${state.filter === 'all' ? 'on' : ''}`}>All · 42</span>
              <span className="tab">Complete · 24</span>
              <span className="tab">Pending · 9</span>
              <span className={`tab ${state.filter === 'missing' ? 'on' : ''} ${state.highlight === 'missingPlate' && state.filter !== 'missing' ? 'is-target' : ''}`}>Missing · 17</span>
            </div>
          </div>
          <div className="tbl">
            <div className="tbl-head">
              <span>Creator</span>
              <span>Deliverable</span>
              <span>Proof</span>
              <span>Due</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {filtered.map(r => (
              <div key={r.id} data-cursor-target={r.id === 'jules' ? 'julesRow' : undefined} className={`tbl-row ${state.highlight === 'julesRow' && r.id === 'jules' ? 'is-target' : ''} ${state.selected === 'julespark' && r.id === 'jules' ? 'is-selected' : ''}`}>
                <div className="creator">
                  <div className="av">{r.av}</div>
                  <span className="handle">{r.handle}</span>
                </div>
                <div className="deliverable">{r.deliverable}</div>
                <div className={`proof ${r.proofCls}`}>{r.proof}</div>
                <div className="due">{r.date}</div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`tag ${r.tag}`}>{r.tagLbl}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="tbl-foot">
            <span>{filtered.length} of {ALL_ROWS.length} · sorted by status</span>
            <span>View all ↓</span>
          </div>
        </section>

        {/* AI assistant */}
        <section className="frame ai-frame">
          <div className="frame-h">
            <div className="ttl"><span className="red">✦</span>AI Reporting Assistant</div>
            <span className="tab on">Active</span>
          </div>
          <div className="ai-list">
            <div className="ai-act">
              <div className="mk" />
              <div>
                <div className="lbl">Matched 42 new screenshots to creators</div>
                <div className="sub">Auto-tagged · 6 sec ago</div>
              </div>
              <div className="ts">Now</div>
            </div>
            <div className="ai-act">
              <div className="mk" />
              <div>
                <div className="lbl">Flagged 17 missing proof items</div>
                <div className="sub">Cross-checked deliverables × proof library</div>
              </div>
              <div className="ts">2m</div>
            </div>
            <div className="ai-act">
              <div className="mk" />
              <div>
                <div className="lbl">Drafted weekly client update</div>
                <div className="sub">4 paragraphs · {state.readiness}% ready</div>
              </div>
              <div className="ts">8m</div>
            </div>
            <div className="ai-act">
              <div className="mk" />
              <div>
                <div className="lbl">Generated 9 follow-up messages</div>
                <div className="sub">Tone matched to past creator threads</div>
              </div>
              <div className="ts">14m</div>
            </div>
            <div className="ai-act q">
              <div className="mk" />
              <div>
                <div className="lbl">Report export queued</div>
                <div className="sub">GlowHaus_SummerLaunch_W12.pdf</div>
              </div>
              <div className="ts">21m</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Detail panel ---------- */
function DetailPanel({ state }) {
  const isOpen = state.detailOpen;

  return (
    <div className={`detail ${isOpen ? 'open' : ''}`}>
      <div className="detail-h">
        <span className="lbl">● Proof Detail · @julespark</span>
        <span className="close">×</span>
      </div>
      <div className="detail-body">
        <div className="detail-creator">
          <div className="av">JP</div>
          <div>
            <div className="nm">@julespark</div>
            <div className="meta">TikTok · 78k · contracted</div>
          </div>
        </div>

        <div>
          <div className="detail-row">
            <div className="k">Deliverable</div>
            <div className="v">TikTok Video · 30–45s</div>
          </div>
          <div className="detail-row">
            <div className="k">Due</div>
            <div className="v">Jun 14 · today + 2</div>
          </div>
          <div className="detail-row">
            <div className="k">Issue</div>
            <div className="v miss">Live link not submitted</div>
          </div>
          <div className="detail-row">
            <div className="k">Status</div>
            <div className="v">Follow-up needed</div>
          </div>
          <div className="detail-row">
            <div className="k">Last contact</div>
            <div className="v">DM · 6 days ago</div>
          </div>
        </div>

        {/* Action: Generate follow-up button OR draft area */}
        {state.aiState === 'idle' && (
          <button data-cursor-target="generateBtn" className={`btn-primary btn-block ${state.highlight === 'generateBtn' ? 'is-target' : ''}`}>
            <span className="arr">✦</span> Generate follow-up
          </button>
        )}

        {state.aiState === 'typing' && (
          <div className="ai-draft">
            <div className="draft-h">
              <span>● AI Drafting follow-up</span>
              <span className="ts">now</span>
            </div>
            <div className="typing"><span></span><span></span><span></span></div>
          </div>
        )}

        {(state.aiState === 'draft' || state.aiState === 'added') && (
          <>
            <div className="ai-draft">
              <div className="draft-h">
                <span>● Draft · ready to send</span>
                <span className="ts">tone · friendly · brief</span>
              </div>
              <div className="draft-body">
                <p>Hi Jules — loved the TikTok preview you shared in DM last week.</p>
                <p>Could you drop the live TikTok URL when it goes up? We need it in the GlowHaus weekly report going to the brand on Friday.</p>
                <p>No rush — anytime before EOD Thursday works.</p>
              </div>
            </div>
            {state.aiState === 'added' ? (
              <div className="added-banner">Added to client update · readiness 82%</div>
            ) : (
              <button data-cursor-target="addUpdateBtn" className={`btn-primary btn-block ${state.highlight === 'addUpdateBtn' ? 'is-target' : ''}`}>
                <span className="arr">→</span> Add to client update
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
function Toast({ show }) {
  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      <span>● Added to GlowHaus_SummerLaunch_W12.pdf</span>
      <span className="sep" />
      <span className="ok">readiness 82%</span>
    </div>
  );
}

/* ---------- Final CTA banner ---------- */
function CTABanner({ show, onReplay }) {
  return (
    <div className={`cta-banner ${show ? 'show' : ''}`}>
      <div>
        <div className="l-eyebrow">● First offer · Vortek.Tech</div>
        <h3>Campaign Reporting<br />&amp; Proof Audit</h3>
        <div className="sub">A paid audit of one real campaign. Built on your stack.</div>
      </div>
      <div className="meta">
        <b>5–7 days</b><br />
        delivery
      </div>
      <a className="cta-btn" href="#" onClick={(e) => { e.preventDefault(); }}>
        Request audit <span className="arr">↗</span>
      </a>
    </div>
  );
}

/* ---------- Floating controls ---------- */
function Controls({ playing, setPlaying, onReplay, step, total }) {
  return (
    <div className="controls">
      <button className="ctl primary" onClick={() => setPlaying(p => !p)} title="Play/Pause">
        {playing ? (
          <svg viewBox="0 0 12 12" fill="currentColor"><rect x="3" y="2.5" width="2" height="7" /><rect x="7" y="2.5" width="2" height="7" /></svg>
        ) : (
          <svg viewBox="0 0 12 12" fill="currentColor"><path d="M3 2L10 6L3 10Z" /></svg>
        )}
      </button>
      <button className="ctl" onClick={onReplay} title="Replay">
        <svg viewBox="0 0 12 12" fill="none"><path d="M2 6a4 4 0 1 0 4-4M2 6V3M2 6h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
      </button>
      <span className="step-ind">{String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
  );
}

/* ============================================================
   App
   ============================================================ */

function Dashboard({ playing = true, speed = 1 }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [clickKey, setClickKey] = useState(0);

  const rootRef = useRef(null);

  // Drive the script
  useEffect(() => {
    if (!playing || stepIdx >= SCRIPT.length) return;
    const cur = SCRIPT[stepIdx];
    if (cur.click) setClickKey(k => k + 1);
    const dur = cur.dur / (speed || 1);
    if (dur <= 0) { setStepIdx(i => i + 1); return; }
    const t = setTimeout(() => setStepIdx(i => i + 1), dur);
    return () => clearTimeout(t);
  }, [stepIdx, playing, speed]);

  const state = useMemo(() => deriveState(Math.min(stepIdx, SCRIPT.length - 1)), [stepIdx]);
  const cur = SCRIPT[Math.min(stepIdx, SCRIPT.length - 1)];

  // Live-measure cursor target from the stage ancestor.
  const [cursorPos, setCursorPos] = useState(POS.rest);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const stage = root.closest('.stage');
    if (!stage || !cur?.target) return;
    const measure = () => {
      if (POS[cur.target]) { setCursorPos(POS[cur.target]); return; }
      const el = root.querySelector(`[data-cursor-target="${cur.target}"]`);
      if (!el) { setCursorPos(POS.rest); return; }
      const stageRect = stage.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scale = stageRect.width / STAGE_W || 1;
      const x = (elRect.left + elRect.width / 2 - stageRect.left) / scale;
      const y = (elRect.top + elRect.height / 2 - stageRect.top) / scale;
      setCursorPos([x, y]);
    };
    measure();
    const t = setTimeout(measure, 60);
    return () => clearTimeout(t);
  }, [stepIdx, state.detailOpen, state.aiState, state.filter]);

  const [cx, cy] = cursorPos;

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0 }}>
      <Topbar />
      <div className="layout">
        <Sidebar />
        <Main state={state} />
      </div>
      <DetailPanel state={state} />
      <Cursor x={cx} y={cy} />
      {cur.click && <ClickPulse k={clickKey} x={cx} y={cy} />}
      <Toast show={state.toast} />
    </div>
  );
}

window.Dashboard = Dashboard;
window.DASHBOARD_DURATION_MS = SCRIPT.reduce((a, s) => a + s.dur, 0);
