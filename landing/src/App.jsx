import { useState } from 'react'

export default function App(){
  const [copied,setCopied]=useState(false)
  const cmd='curl -fsSL https://code.hystersis.com/install.sh | sh'

  return (
    <div style={{background:'#000', color:'#fff', fontFamily:'JetBrains Mono, monospace', minHeight:'100vh', padding:'12px'}}>
      <style>{`
        *{box-sizing:border-box}
        pre{margin:0; white-space:pre-wrap; word-break:break-word}
        a{color:#fff}
        ::selection{background:#fff;color:#000}
        @media(max-width:600px){
          .hero-title{font-size:18px !important; line-height:20px !important}
          .curl{flex-direction:column !important; align-items:stretch !important; gap:8px !important}
          .curl code{font-size:9px !important; white-space:normal !important; word-break:break-all !important; overflow-wrap:anywhere !important}
          .curl button{width:100% !important}
          .tui{font-size:9px !important}
        }
      `}</style>

      <header style={{maxWidth:'760px', margin:'0 auto', border:'1px solid #fff', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', fontSize:'11px'}}>
        <a href="/" style={{textDecoration:'none', fontWeight:700}}>hystersis</a>
        <nav style={{display:'flex', gap:'12px'}}>
          <a href="#pricing" style={{textDecoration:'none'}}>[Pricing]</a>
          <a href="#install" style={{textDecoration:'none'}}>[Install]</a>
          <a href="https://github.com/Himan-D/code" target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>[GitHub]</a>
        </nav>
      </header>

      <main style={{maxWidth:'760px', margin:'0 auto', border:'1px solid #fff', borderTop:'none', padding:'0'}}>
        <section aria-label="Hero" style={{padding:'16px 12px 0'}}>
          <h1 className="hero-title" style={{fontSize:'22px', lineHeight:'22px', margin:0, fontWeight:800, letterSpacing:'0.06em'}}>HYSTERSIS</h1>
          <h2 style={{fontSize:'13px', lineHeight:'15px', margin:'6px 0 0', fontWeight:400, letterSpacing:'0.12em', opacity:0.95}}>YOUR CODEBASE<br/>UNDERSTOOD.</h2>
          <p style={{fontSize:'11px', lineHeight:'15px', margin:'8px 0 0', opacity:0.8}}>terminal-based AI coding agent — Rust-native.<br/>Full-screen TUI. Same UI you run locally.</p>
        </section>

        <section id="install" aria-label="Install" style={{margin:'16px 12px 0', border:'1px solid #fff', padding:'8px 10px'}}>
          <div className="curl" style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
            <span style={{opacity:0.6, fontSize:'10px'}}>$</span>
            <code style={{fontSize:'10px', flex:1, minWidth:'160px', wordBreak:'break-all'}}>{cmd}</code>
            <button onClick={()=>{navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(()=>setCopied(false),1200)}} aria-label="Copy install command" style={{background:'#fff', color:'#000', border:'1px solid #fff', padding:'4px 10px', fontFamily:'JetBrains Mono, monospace', fontSize:'11px', cursor:'pointer', fontWeight:700, whiteSpace:'nowrap'}}>{copied?'[ COPIED ]':'[ COPY ]'}</button>
          </div>
        </section>
        <p style={{fontSize:'9px', opacity:0.5, textAlign:'center', margin:'6px 12px 0'}}>hystersis --version · cargo run -p hystersis-pager-bin · macOS / Linux / Windows</p>

        <section aria-label="About" style={{padding:'18px 12px 0'}}>
          <h2 style={{fontSize:'11px', margin:0, opacity:0.7}}>&gt; about</h2>
          <p style={{fontSize:'11px', lineHeight:'16px', margin:'8px 0 0'}}>Hystersis is an engineering-driven terminal agent. Pinned toolchain, sandboxed tools, full-screen TUI with checkpointing. Reads your codebase before it touches it.</p>
          <div style={{marginTop:'12px', display:'grid', gap:'8px'}}>
            <div style={{border:'1px solid #fff', padding:'8px'}}>
              <h3 style={{fontSize:'10px', margin:0, letterSpacing:'0.06em'}}>RUST-NATIVE, NO WRAPPER</h3>
              <p style={{fontSize:'10px', margin:'4px 0 0', opacity:0.8, lineHeight:'14px'}}>Workspace-aware edits, hunk tracking, VCS safety, fast worktree, process-scope enroll.</p>
            </div>
            <div style={{border:'1px solid #fff', padding:'8px'}}>
              <h3 style={{fontSize:'10px', margin:0, letterSpacing:'0.06em'}}>TUI + HEADLESS + ACP</h3>
              <p style={{fontSize:'10px', margin:'4px 0 0', opacity:0.8, lineHeight:'14px'}}>Same agent in TUI, headless for CI, or via ACP. Scrollback, modals, diff done right.</p>
            </div>
            <div style={{border:'1px solid #fff', padding:'8px'}}>
              <h3 style={{fontSize:'10px', margin:0, letterSpacing:'0.06em'}}>TOOLS THAT RUN</h3>
              <p style={{fontSize:'10px', margin:'4px 0 0', opacity:0.8, lineHeight:'14px'}}>Terminal, file edits, search, MCP, skills, hooks — checkpointed. Long tasks via queue.</p>
            </div>
          </div>
        </section>

        <section aria-label="TUI preview" className="tui" style={{margin:'14px 12px 0', border:'1px solid #fff', padding:'10px', fontSize:'10px', lineHeight:'14px', overflow:'auto'}}>
          <div style={{display:'flex', justifyContent:'space-between', opacity:0.7, borderBottom:'1px solid #fff', paddingBottom:'6px', marginBottom:'8px'}}>
            <span>hystersis</span><span>[● ready]</span>
          </div>
          <div>&gt; Refactor auth middleware to use new store</div>
          <div style={{marginTop:'6px', opacity:0.8}}>· [scan] crates/codegen/hystersis-agent ...<br/>· [edit] src/builder.rs +42 -8<br/>· [check] cargo check ✔ 1.79s · [test] 12 passed</div>
          <div style={{marginTop:'8px', borderTop:'1px dashed #fff', paddingTop:'6px'}}>— Done. 2 files edited, 0 conflicts.</div>
          <div style={{marginTop:'8px', opacity:0.6, fontSize:'9px', borderTop:'1px solid #fff', paddingTop:'6px'}}>[Enter] send &nbsp; [/] commands &nbsp; [Ctrl+C] interrupt</div>
        </section>

        <section aria-label="Pricing" style={{padding:'14px 12px 0'}}>
          <h2 style={{fontSize:'11px', margin:0, opacity:0.7}}>&gt; pricing</h2>
          <p style={{fontSize:'10px', margin:'6px 0 0', opacity:0.7}}>Simple, usage-based.</p>
          <div style={{marginTop:'10px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'8px'}}>
            {[
              {name:'Free', price:'$0', credits:'100', features:['100 credits/mo','Community','Hystersis TUI'], cta:'[ Start free ]', href:'#install', primary:false},
              {name:'Pro', price:'$19', credits:'2,000', highlight:true, features:['2,000 credits/mo','Email support','All features'], cta:'[ Subscribe — Pro ]', priceId:'price_pro'},
              {name:'Team', price:'$49', credits:'6,000', features:['6,000 credits/mo','Priority support','Team billing','All features'], cta:'[ Subscribe — Team ]', priceId:'price_team'},
            ].map(p=>(
              <div key={p.name} style={{border: p.highlight ? '2px solid #fff' : '1px solid #fff', padding:'10px', background: p.highlight ? '#fff' : 'transparent', color: p.highlight ? '#000' : '#fff'}}>
                <h3 style={{fontSize:'11px', margin:0}}>{p.name} {p.highlight && <span style={{fontSize:'8px', border:'1px solid #000', padding:'1px 4px', marginLeft:'6px'}}>POPULAR</span>}</h3>
                <div style={{fontSize:'18px', fontWeight:800, margin:'6px 0 0'}}>{p.price}<span style={{fontSize:'10px', fontWeight:400, opacity:0.7}}>/mo</span></div>
                <div style={{fontSize:'10px', opacity:0.7}}>{p.credits} credits included</div>
                <ul style={{fontSize:'10px', margin:'8px 0 0 14px', lineHeight:'14px'}}>
                  {p.features.map(f=><li key={f}>{f}</li>)}
                </ul>
                <button onClick={async()=>{
                  if(!p.priceId){ window.location.hash='#install'; return; }
                  const key = prompt('Enter your Trinetra API key (from `hystersis configure`):');
                  if(!key) return;
                  try{
                    const res = await fetch('https://trinetra-ai-gateway.himanshu-dixit.workers.dev/v1/billing/create-checkout', {
                      method:'POST', headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${key}`},
                      body: JSON.stringify({ priceId: p.priceId, successUrl: window.location.href + '?paid=1', cancelUrl: window.location.href })
                    });
                    const data = await res.json();
                    if(data.url) window.location.href = data.url;
                    else alert(data.error || 'Checkout failed — set STRIPE_SECRET_KEY in Worker');
                  }catch(e){ alert('Checkout error: '+e.message)}
                }} style={{marginTop:'10px', width:'100%', background: p.highlight ? '#000' : '#fff', color: p.highlight ? '#fff' : '#000', border:'1px solid '+(p.highlight?'#000':'#fff'), padding:'6px', fontFamily:'JetBrains Mono, monospace', fontSize:'11px', cursor:'pointer', fontWeight:700}}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{fontSize:'9px', opacity:0.5, marginTop:'6px'}}>Secure checkout via Stripe.</p>
        </section>

        <section aria-label="Playground" style={{padding:'14px 12px 0'}}>
          <h2 style={{fontSize:'10px', margin:0, opacity:0.7}}>&gt; playground</h2>
          <p style={{fontSize:'11px', margin:'6px 0 0', lineHeight:'15px'}}>Paste the curl. Run hystersis. Ask it anything.</p>
          <ul style={{fontSize:'10px', margin:'6px 0 0 14px', lineHeight:'15px', opacity:0.9}}>
            <li>Refactor auth middleware to use session store</li>
            <li>Explain this codebase in one page</li>
            <li>Find where we handle checkpointing</li>
          </ul>
          <p style={{fontSize:'10px', margin:'6px 0 0', opacity:0.7}}>It reads, edits, checks — then shows you the diff.</p>
        </section>

        <div style={{margin:'16px 12px 0', border:'1px solid #fff', padding:'10px', textAlign:'center', display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap'}}>
          <a href="#install" style={{border:'1px solid #fff', padding:'6px 12px', textDecoration:'none', fontSize:'11px', background:'#fff', color:'#000', fontWeight:700}}>[ Install now ]</a>
          <a href="https://github.com/Himan-D/code" target="_blank" rel="noreferrer" style={{border:'1px solid #fff', padding:'6px 12px', textDecoration:'none', fontSize:'11px'}}>[ GitHub → ]</a>
        </div>

        <footer style={{marginTop:'16px', borderTop:'1px solid #fff', padding:'10px 12px', display:'flex', justifyContent:'space-between', fontSize:'9px', opacity:0.5}}>
          <span>© 2026 Hystersis</span>
          <span>hystersis.com · code.hystersis.com</span>
        </footer>
      </main>
    </div>
  )
}
