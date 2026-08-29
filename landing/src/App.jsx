import { useState } from 'react'

export default function App(){
  const [copied,setCopied]=useState(false)
  const [yearly,setYearly]=useState(false)
  const cmd='curl -fsSL https://code.hystersis.com/install.sh | sh'

  return (
    <div style={{background:'#0a0a0a', color:'#e8e8e8', fontFamily:'Inter, system-ui, -apple-system, sans-serif', minHeight:'100vh'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        ::selection{background:#e8e8e8;color:#0a0a0a}
        a{color:inherit; text-decoration:none}
        a:hover{opacity:0.7}
        pre{margin:0}
        @media(max-width:640px){
          .hero-title{font-size:32px !important}
          .nav{font-size:12px !important}
        }
      `}</style>

      {/* Nav — zen: thin, airy */}
      <header style={{maxWidth:'960px', margin:'0 auto', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1a1a1a'}}>
        <div style={{display:'flex', gap:'32px', alignItems:'center'}}>
          <a href="/" style={{fontFamily:'JetBrains Mono, monospace', fontSize:'14px', fontWeight:600, letterSpacing:'-0.02em'}}>hystersis</a>
          <nav className="nav" style={{display:'flex', gap:'20px', fontSize:'13px', color:'#888'}}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#team">Team</a>
          </nav>
        </div>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <a href="https://github.com/Himan-D/hystersis" target="_blank" rel="noreferrer" style={{fontSize:'13px', color:'#888'}}>GitHub</a>
          <a href="#install" style={{fontSize:'13px', background:'#fff', color:'#000', padding:'6px 14px', fontWeight:500}}>Install</a>
        </div>
      </header>

      <main style={{maxWidth:'960px', margin:'0 auto', padding:'0 24px'}}>

        {/* Hero — zen: huge, quiet, centered */}
        <section style={{padding:'80px 0 40px', textAlign:'center'}}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'0.15em', color:'#666', marginBottom:'24px'}}>TERMINAL-NATIVE • RUST-NATIVE • OPEN SOURCE</div>
          <h1 className="hero-title" style={{fontSize:'48px', fontWeight:700, letterSpacing:'-0.03em', lineHeight:'1', margin:0}}>Your codebase,<br/><span style={{color:'#888', fontWeight:400}}>understood.</span></h1>
          <p style={{fontSize:'16px', color:'#888', margin:'16px auto 0', maxWidth:'520px', lineHeight:'1.6'}}>The autonomous coding agent that reads before it writes. Full-screen TUI, sandboxed tools, checkpointed edits.</p>
          
          <div id="install" style={{margin:'32px auto 0', maxWidth:'560px', background:'#111', border:'1px solid #222', padding:'14px 16px', display:'flex', gap:'12px', alignItems:'center'}}>
            <span style={{fontFamily:'JetBrains Mono, monospace', fontSize:'12px', color:'#555'}}>$</span>
            <code style={{fontFamily:'JetBrains Mono, monospace', fontSize:'13px', flex:1, textAlign:'left', color:'#e8e8e8'}}>{cmd}</code>
            <button onClick={()=>{navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(()=>setCopied(false),1500)}} style={{fontFamily:'JetBrains Mono, monospace', fontSize:'12px', background:'#fff', color:'#000', border:'none', padding:'6px 12px', cursor:'pointer', fontWeight:500}}>{copied?'Copied':'Copy'}</button>
          </div>
          <div style={{fontSize:'12px', color:'#555', marginTop:'10px'}}>macOS • Linux • Windows • <span style={{color:'#888'}}>hystersis --version</span></div>
        </section>

        {/* TUI preview — zen: floating card */}
        <section style={{margin:'20px 0 0', background:'#111', border:'1px solid #222', padding:'20px', fontFamily:'JetBrains Mono, monospace', fontSize:'12px', lineHeight:'1.6'}}>
          <div style={{display:'flex', justifyContent:'space-between', color:'#555', borderBottom:'1px solid #1a1a1a', paddingBottom:'10px', marginBottom:'14px'}}>
            <span>hystersis</span><span style={{color:'#4ade80'}}>● ready</span>
          </div>
          <div style={{color:'#e8e8e8'}}>&gt; Refactor auth middleware to use new store</div>
          <div style={{color:'#888', marginTop:'8px'}}>· [scan] crates/codegen/hystersis-agent ...<br/>· [edit] src/builder.rs +42 -8<br/>· [check] cargo check ✔ 1.79s · [test] 12 passed</div>
          <div style={{color:'#555', marginTop:'12px', borderTop:'1px dashed #222', paddingTop:'10px'}}>— Done. 2 files edited, 0 conflicts. [Enter] send · [/] commands · [Ctrl+C] interrupt</div>
        </section>

        {/* Features — zen: 6, airy grid */}
        <section id="features" style={{padding:'60px 0 0'}}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', color:'#666', marginBottom:'24px'}}>— FEATURES</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'1px', background:'#222', border:'1px solid #222'}}>
            {[
              ['Rust-native','Workspace-aware edits, hunk tracking, VCS safety, fast worktree. No wrapper, no lag.'],
              ['TUI + Headless + ACP','Same agent in full-screen TUI, CI headless, or ACP. Scrollback and diff done right.'],
              ['Tools that run','Terminal, file edits, search, MCP, skills, hooks — checkpointed. Long tasks via queue.'],
              ['Checkpointing','Every edit is reversible. Rewind, diff, and re-apply without losing context.'],
              ['Sandboxed','Process-scope enrollment, permission modes, yolo off by default. Safe by design.'],
              ['Bring your model','OpenRouter, Anthropic, OpenAI, Azure — or Trinetra gateway. You own the key.'],
            ].map(([t,d])=>(
              <div key={t} style={{background:'#0a0a0a', padding:'24px'}}>
                <h3 style={{fontSize:'13px', fontWeight:600, margin:'0 0 8px'}}>{t}</h3>
                <p style={{fontSize:'13px', color:'#888', lineHeight:'1.5', margin:0}}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing — zen: toggle, clean cards */}
        <section id="pricing" style={{padding:'60px 0 0'}}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', color:'#666', marginBottom:'8px'}}>— PRICING</div>
          <h2 style={{fontSize:'24px', fontWeight:600, margin:'0 0 8px', letterSpacing:'-0.02em'}}>Simple, usage-based.</h2>
          <p style={{fontSize:'14px', color:'#888', margin:'0 0 16px'}}>Credits = 1¢. Save 20% yearly. Secure checkout via Stripe.</p>
          <div style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'20px', fontSize:'13px'}}>
            <span style={{color: yearly?'#555':'#fff'}}>Monthly</span>
            <button onClick={()=>setYearly(!yearly)} style={{width:'40px', height:'22px', background: yearly?'#fff':'#222', border:'1px solid #333', borderRadius:'999px', position:'relative', cursor:'pointer'}}>
              <span style={{position:'absolute', top:'2px', left: yearly?'18px':'2px', width:'16px', height:'16px', background: yearly?'#000':'#888', borderRadius:'50%', transition:'left 0.15s'}}/>
            </button>
            <span style={{color: yearly?'#fff':'#555'}}>Yearly <span style={{fontSize:'10px', background:'#fff', color:'#000', padding:'2px 6px', marginLeft:'6px', fontWeight:600}}>−20%</span></span>
          </div>
          {(() => {
            const plans = yearly ? [
              {name:'Free', price:'$0', period:'/mo', credits:'100', features:['100 credits/mo','Community','Hystersis TUI'], cta:'Start free'},
              {name:'Pro', price:'$182', period:'/yr', sub:'$15.17/mo', credits:'24,000/yr', save:'Save $46', highlight:true, features:['2,000 credits/mo','Email support','All features'], cta:'Subscribe — Pro Yearly', priceId:'price_pro_yearly'},
              {name:'Team', price:'$470', period:'/yr', sub:'$39.17/mo', credits:'72,000/yr', save:'Save $118', features:['6,000 credits/mo','Priority support','Team billing','All features'], cta:'Subscribe — Team Yearly', priceId:'price_team_yearly'},
            ] : [
              {name:'Free', price:'$0', period:'/mo', credits:'100', features:['100 credits/mo','Community','Hystersis TUI'], cta:'Start free'},
              {name:'Pro', price:'$19', period:'/mo', credits:'2,000', highlight:true, features:['2,000 credits/mo','Email support','All features'], cta:'Subscribe — Pro', priceId:'price_pro'},
              {name:'Team', price:'$49', period:'/mo', credits:'6,000', features:['6,000 credits/mo','Priority support','Team billing','All features'], cta:'Subscribe — Team', priceId:'price_team'},
            ]
            return (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1px', background:'#222', border:'1px solid #222'}}>
                {plans.map(p=>(
                  <div key={p.name+String(yearly)} style={{background: p.highlight?'#fff':'#0a0a0a', color: p.highlight?'#000':'#e8e8e8', padding:'24px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{fontSize:'14px', fontWeight:600, margin:0}}>{p.name}</h3>
                      {p.highlight && <span style={{fontSize:'10px', background:'#000', color:'#fff', padding:'3px 8px'}}>POPULAR</span>}
                      {p.save && <span style={{fontSize:'10px', background:'#000', color:'#fff', padding:'3px 8px'}}>{p.save}</span>}
                    </div>
                    <div style={{fontSize:'28px', fontWeight:700, marginTop:'12px'}}>{p.price}<span style={{fontSize:'13px', fontWeight:400, color: p.highlight?'#666':'#888'}}>{p.period}</span>{p.sub && <span style={{fontSize:'11px', color:'#888'}}> {p.sub}</span>}</div>
                    <div style={{fontSize:'12px', color:'#888', marginTop:'4px'}}>{p.credits} credits</div>
                    <ul style={{fontSize:'13px', color: p.highlight?'#444':'#888', margin:'16px 0 0 16px', lineHeight:'1.7'}}>
                      {p.features.map(f=><li key={f}>{f}</li>)}
                    </ul>
                    <button onClick={async()=>{
                      if(!p.priceId){ document.getElementById('install')?.scrollIntoView({behavior:'smooth'}); return; }
                      const key = prompt('Trinetra API key (hystersis configure):');
                      if(!key) return;
                      try{
                        const res = await fetch('https://trinetra-ai-gateway.himanshu-dixit.workers.dev/v1/billing/create-checkout', {
                          method:'POST', headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${key}`},
                          body: JSON.stringify({ priceId: p.priceId, successUrl: location.href+'?paid=1', cancelUrl: location.href })
                        });
                        const d = await res.json();
                        if(d.url) location.href = d.url; else alert(d.error||'Checkout failed');
                      }catch(e){ alert(e.message)}
                    }} style={{marginTop:'20px', width:'100%', padding:'10px', fontSize:'13px', fontWeight:500, background: p.highlight?'#000':'#fff', color: p.highlight?'#fff':'#000', border:'none', cursor:'pointer'}}>
                      {p.cta}
                    </button>
                  </div>
                ))}
              </div>
            )
          })()}
        </section>

        {/* Team — zen: minimal */}
        <section id="team" style={{padding:'60px 0 0'}}>
          <div style={{fontFamily:'JetBrains Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', color:'#666', marginBottom:'24px'}}>— TEAM</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'24px'}}>
            <div>
              <div style={{width:'48px', height:'48px', background:'#222', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px'}}>HD</div>
              <h3 style={{fontSize:'14px', fontWeight:600, margin:'12px 0 4px'}}>Himanshu Dixit</h3>
              <p style={{fontSize:'13px', color:'#888', margin:0}}>Founder • Trinetra Labs • xAI Hystersis core</p>
            </div>
            <div style={{borderLeft:'1px solid #1a1a1a', paddingLeft:'24px'}}>
              <p style={{fontSize:'14px', color:'#888', lineHeight:'1.6', margin:0}}>Building the autonomous coding agent — Rust-native, terminal-first, checkpointed. Forked from xAI monorepo, now serving Trinetra gateway with D1 billing and Stripe.</p>
              <p style={{fontSize:'13px', marginTop:'12px'}}><a href="https://github.com/Himan-D/hystersis" style={{color:'#fff', borderBottom:'1px solid #333'}}>GitHub</a> · <a href="mailto:himan@trinetralabs.ai" style={{color:'#fff', borderBottom:'1px solid #333'}}>Contact</a></p>
            </div>
          </div>
        </section>

        <footer style={{marginTop:'60px', borderTop:'1px solid #1a1a1a', padding:'20px 0', display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#555'}}>
          <span>© 2026 Trinetra Labs • Hystersis</span>
          <span>hystersis.com • code.hystersis.com • MIT</span>
        </footer>
      </main>
    </div>
  )
}
