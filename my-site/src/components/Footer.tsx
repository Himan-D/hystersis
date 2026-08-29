export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-white font-bold text-xl">MySite</span>
          <p className="text-slate-500 text-sm mt-1">Built with React + Vite + Tailwind</p>
        </div>
        <nav className="flex gap-6 text-slate-400 text-sm">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#about" className="hover:text-indigo-400 transition-colors">About</a>
          <a href="mailto:hello@mysite.com" className="hover:text-indigo-400 transition-colors">Contact</a>
        </nav>
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} MySite. All rights reserved.</p>
      </div>
    </footer>
  )
}
