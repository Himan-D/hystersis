const features = [
  {
    icon: '⚡',
    title: 'Blazing fast',
    description: 'Powered by Vite — hot module replacement in milliseconds, not seconds.',
  },
  {
    icon: '🎨',
    title: 'Beautiful by default',
    description: 'Tailwind CSS v4 utility classes mean great-looking UI without writing custom CSS.',
  },
  {
    icon: '🔒',
    title: 'Fully typed',
    description: 'TypeScript strict mode catches bugs at compile time before they reach production.',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-slate-800 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center text-balance mb-4">
          Why this stack?
        </h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto text-pretty">
          Everything you need to build fast, production-grade web apps with great DX.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 rounded-2xl p-8 flex flex-col gap-4 hover:ring-1 hover:ring-indigo-500 transition-all"
            >
              <span className="text-4xl">{f.icon}</span>
              <h3 className="text-white font-semibold text-xl">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
