import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { castTotal, sliceCast } from './cast.js'

const INSTALL_UNIX = 'curl -fsSL https://code.hystersis.com/install.sh | sh'
const INSTALL_WIN = 'powershell -NoProfile -c "irm https://code.hystersis.com/install.ps1 | iex"'
const REPO = 'https://github.com/Himan-D/hystersis'

function detectOS() {
  if (typeof navigator === 'undefined') return { os: 'unknown', label: 'macOS · Linux · Windows', prompt: '$' }
  const ua = (navigator.userAgent || '').toLowerCase()
  const plat = (navigator.platform || '').toLowerCase()
  const isWin = ua.includes('win') || plat.includes('win')
  const isMac = ua.includes('mac') || plat.includes('mac')
  const isLinux = ua.includes('linux') || plat.includes('linux') || ua.includes('x11')
  if (isWin) return { os: 'windows', label: 'Windows', prompt: '>' }
  if (isMac) return { os: 'macos', label: 'macOS', prompt: '$' }
  if (isLinux) return { os: 'linux', label: 'Linux', prompt: '$' }
  return { os: 'unknown', label: 'macOS · Linux · Windows', prompt: '$' }
}

function useOS() {
  const [os, setOs] = useState({ os: 'unknown', label: 'macOS · Linux · Windows', prompt: '$' })
  useEffect(() => setOs(detectOS()), [])
  return os
}

const CAST = [
  { text: '$ hystersis', tone: 't1' },
  { text: '· session  ~/src/api · toolchain pinned · sandbox on', tone: 't3' },
  { text: '', tone: 't3' },
  { text: '> refactor auth middleware to the new session store', tone: 't1' },
  { text: '· scan     148 files · 12.4k symbols · 0.6s', tone: 't2' },
  { text: '· plan     2 edits · 1 check · 1 test', tone: 't2' },
  { text: '· edit     src/auth/middleware.rs', tone: 't2' },
  { text: '    -   let user = ctx.session_id();', tone: 't3' },
  { text: '    +   let user = store.resolve(ctx.session_id())?;', tone: 't1' },
  { text: '· edit     src/auth/session.rs            +11  -0', tone: 't2' },
  { text: '· check    cargo check                    ok 1.79s', tone: 't2' },
  { text: '· test     cargo test                     12 passed', tone: 't2' },
  { text: '', tone: 't3' },
  { text: '- done · 2 files · 0 conflicts · checkpoint #7', tone: 't1' },
  { text: '  [d] diff    [k] keep    [u] undo', tone: 't3' }
]

const FEATURES = [
  ['01', 'Rust-native, no wrapper', 'Workspace-aware edits, hunk tracking, VCS safety, fast worktree, process-scope enroll.'],
  ['02', 'TUI · headless · ACP', 'Same agent in full-screen TUI, headless in CI, or embedded over ACP. Scrollback, modals, diffs.'],
  ['03', 'Tools that run', 'Terminal, file edits, search, MCP, skills, hooks — every step checkpointed. Long tasks queued.']
]

const CAST_SECONDS = 74
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

const ASKS = [
  'Refactor auth middleware to the session store',
  'Explain this codebase in one page',
  'Find where we handle checkpointing'
]

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduce(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

function useInView(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } },
      { rootMargin: '0px 0px -12% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

function useTypewriter(text, active, speed = 32) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) return
    if (reduce) { setN(text.length); return }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [active, text, speed, reduce])
  const shown = text.slice(0, n)
  return { shown, done: n >= text.length, caret: active && n < text.length }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

function useKeyboardShortcuts(installCmd) {
  useEffect(() => {
    const onKeyDown = async (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      
      if (e.key === 'j') {
        window.scrollBy({ top: 150, behavior: 'smooth' })
      } else if (e.key === 'k') {
        window.scrollBy({ top: -150, behavior: 'smooth' })
      } else if (e.key === 'c') {
        const ok = await copyText(installCmd)
        if (ok) window.dispatchEvent(new CustomEvent('cmd-copied-success'))
      } else if (e.key === 't') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (e.key === 'b') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [installCmd])
}

function Block({ id, prompt, children }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const { shown, done, caret } = useTypewriter(prompt, seen)

  return (
    <section className="block" id={id} ref={ref}>
      <h2 className="prompt">
        <span aria-hidden="true">&gt;</span>
        <span className="prompt-text">
          {shown}
          {caret && <i className="caret" aria-hidden="true" />}
        </span>
      </h2>
      <div className="answer" style={{ opacity: done ? 1 : 0 }}>
        {children}
      </div>
    </section>
  )
}

function CopyButton({ text, className = 'btn btn--sm', idle = '[ copy ]' }) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = useCallback(async () => {
    const ok = await copyText(text)
    setState(ok ? 'done' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 1600)
  }, [text])
  const label = state === 'done' ? '[ copied ]' : state === 'failed' ? '[ press ctrl+c ]' : idle
  return (
    <button type="button" className={className} onClick={onClick} aria-label="Copy install command">
      {label}
    </button>
  )
}

function Cast() {
  const ref = useRef(null)
  const seen = useInView(ref)
  const reduce = useReducedMotion()
  const total = useMemo(() => castTotal(CAST), [])
  const [n, setN] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!seen || reduce || !playing) return
    const id = setInterval(() => setN((v) => (v > total + 90 ? 0 : v + 3)), 26)
    return () => clearInterval(id)
  }, [seen, reduce, playing, total])

  const at = reduce ? total : Math.min(n, total)
  const lines = sliceCast(CAST, at)
  const pct = total ? Math.round((at / total) * 100) : 0
  const clock = `${mmss(Math.round((pct / 100) * CAST_SECONDS))} / ${mmss(CAST_SECONDS)}`

  return (
    <div className="cast" ref={ref}>
      <div className="cast-head">
        <b>┌─ asciicast: demo.cast ─</b>
        <span>{clock}</span>
      </div>
      <div className="cast-body">
        {lines.map((l, i) => (
          <div key={i} className={`cast-line ${l.tone}`}>
            {l.shown}
            {l.caret && !reduce && <i className="caret" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <div className="cast-foot">
        <button type="button" className="btn btn--quiet" onClick={() => { setN(0); setPlaying(true) }}>
          [ replay ]
        </button>
        <button type="button" className="btn btn--quiet" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>
          {playing ? '[ pause ]' : '[ play ]'}
        </button>
        <div className="bar" aria-hidden="true">
          <div style={{ width: `${pct}%` }} />
        </div>
        <span className="cast-note">real capture · not a video</span>
      </div>
    </div>
  )
}

export default function App() {
  const os = useOS()
  const installCmd = os.os === 'windows' ? INSTALL_WIN : INSTALL_UNIX
  const osHint = os.os === 'unknown' ? 'macOS · Linux · Windows' : `detected: ${os.label} · auto`

  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-in">
          <a className="brand" href="#top">
            <span className="brand-mark">H</span>
            <span className="brand-name">hystersis</span>
            <span className="brand-meta">~/src/api · ● ready</span>
          </a>
          <nav className="nav">
            <a className="nl" href="#about">[ about ]</a>
            <a className="nl" href="#demo">[ demo ]</a>
            <a className="nl" href={REPO} target="_blank" rel="noreferrer">[ github ]</a>
            <a className="nl nl--cta" href="#install">[ install ]</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="wrap hero" id="top">
          <pre className="ascii-title" aria-label="HYSTERSIS">
{`██░ █░ █░█ █░ █ ▄▀▀▀ ▀█▀ █▀▀ █▀█ █ ▄▀▀▀ █ ▄▀▀▀
██░ █░ █░ █░ █ ▀▀▀█ ░█░ █▀▀ █▀▄ █ ▀▀▀█ █ ▀▀▀█
░█░ █░ █░ █░ █ ▀▀▀█ ░█░ █▀▀ █▀▄ █ ▀▀▀█ █ ▀▀▀█
▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀  ░▀░ ▀▀▀ ▀░▀ ▀ ▀▀▀  ▀ ▀▀▀ `}
          </pre>
          <p className="kicker">rust-native · terminal agent · tui / headless / acp</p>
          <h1 style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>HYSTERSIS</h1>
          <p className="tagline">Your codebase, understood.</p>
          <p className="lead">
            Full-screen terminal UI that reads your repo before it touches it.<br />
            Pinned toolchain, sandboxed tools, checkpointed edits — same agent<br />
            in your terminal, in CI, or embedded over ACP.
          </p>

          <div className="cmd">
            <div className="cmd-head">
              <b>install</b>
              <i>{osHint}</i>
            </div>
            <div className="cmd-row">
              <span aria-hidden="true">{os.prompt}</span>
              <code>{installCmd}</code>
              <CopyButton text={installCmd} />
            </div>
          </div>

          <p className="hint">
            <span aria-hidden="true">↓</span>
            <span>keep scrolling — rest of page is a session</span>
          </p>
          <hr className="hr" />
        </section>

        <div className="wrap">
          <Block id="about" prompt="what is hystersis?">
            <p className="answer-lead">
              Engineering-driven terminal agent. It scans, plans, edits and verifies — shows you the diff before anything lands.
            </p>
            <div className="cards">
              {FEATURES.map(([n, title, body]) => (
                <article className="card" key={n}>
                  <p className="card-n">[{n}]</p>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </Block>

          <Block id="demo" prompt="show me a real run">
            <Cast />
          </Block>

          <Block id="ask" prompt="what should I ask it?">
            <p className="answer-lead">Anything you would ask the engineer who wrote it.</p>
            <div className="asks">
              {ASKS.map((a) => (
                <div className="ask" key={a}>
                  <span aria-hidden="true">&gt;</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
            <p className="lead" style={{ marginTop: 16 }}>
              It reads, edits and checks — then shows the diff before you keep it.
            </p>
          </Block>

          <Block id="install" prompt="how do I install it?">
            <div className="cmd" style={{ marginTop: 0, maxWidth: '100%' }}>
              <div className="cmd-head">
                <b>install</b>
                <i>{osHint}</i>
              </div>
              <div className="cmd-row">
                <span aria-hidden="true">{os.prompt}</span>
                <code>{installCmd}</code>
                <CopyButton text={installCmd} />
              </div>
            </div>

            <div className="cta" style={{ marginTop: 14 }}>
              <div>
                <h2>One line. Then it knows your repo.</h2>
                <p>free · open source · macos / linux / windows</p>
              </div>
              <div className="cta-actions">
                <CopyButton text={installCmd} className="btn btn--solid" idle="[ copy install ]" />
                <a className="btn" href={REPO} target="_blank" rel="noreferrer">[ github → ]</a>
              </div>
            </div>

            <div className="strip">
              <span>hystersis --version</span>
              <span>cargo run -p hystersis-pager-bin</span>
              <span>no telemetry</span>
            </div>
          </Block>
        </div>
      </main>

      <footer className="ftr">
        <div className="wrap ftr-in">
          <span>^C · session ended</span>
          <span className="ftr-end">
            <a href="#top">[ ↑ top ]</a>
            <span>© 2026 hystersis · code.hystersis.com</span>
          </span>
        </div>
      </footer>
    </>
  )
}
