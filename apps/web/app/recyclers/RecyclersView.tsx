"use client";

const PARTNERS = ["ERI", "Sims Lifecycle Services", "Call2Recycle", "Dynamic Lifecycle Innovations", "Cohen Recycling", "CompuCycle", "TechDump"];

const PREP = ["Back up and erase your data.", "Remove SIM and memory cards.", "Tape the terminals on loose batteries."];

export function RecyclersView() {
  return (
    <div className="p-8 md:p-10">
      {/* Page Header */}
      <header className="card-header text-white mb-8 p-6 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Recyclers</h1>
            <p className="mt-1 text-base text-[#A3B8A8]">R2v3 or e-Stewards certified</p>
          </div>
        </div>
        <p className="text-lg text-[#A3B8A8]">{PARTNERS.length} recycling partners</p>
      </header>

      <main className="space-y-8">
        <section aria-label="Partners">
          <h2 className="text-sm font-medium text-[#15261F] uppercase tracking-wider mb-4">Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
            {PARTNERS.map((name) => (
              <article key={name} className="card-elevated-light p-6 md:p-8" role="listitem">
                <h3 className="text-lg font-medium text-[#15261F]">{name}</h3>
              </article>
            ))}
          </div>
        </section>

        <aside className="card-elevated text-white p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Before you hand it in</h2>
          <ol className="space-y-3">
            {PREP.map((text, i) => (
              <li key={text} className="flex gap-4 text-base leading-7">
                <span className="p-num text-sm font-medium text-[#81D8D0] shrink-0">0{i + 1}</span>
                <span className="text-on-dark-secondary">{text}</span>
              </li>
            ))}
          </ol>
        </aside>
      </main>
    </div>
  );
}