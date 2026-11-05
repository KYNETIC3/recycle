import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recyclers | eLoop" };

const PARTNERS = ["ERI", "Sims Lifecycle Services", "Call2Recycle", "Dynamic Lifecycle Innovations", "Cohen Recycling", "CompuCycle", "TechDump"];

const PREP = ["Back up and erase your data.", "Remove SIM and memory cards.", "Tape the terminals on loose batteries."];

export default function RecyclersPage() {
  return (
    <div className="pb-16 md:px-10 md:pt-8 md:pb-10">
      <header className="p-in flex flex-col gap-1 bg-forest px-4 py-5 text-white md:gap-1.5 md:bg-transparent md:p-0 md:text-ink">
        <span className="p-label text-mint md:text-muted">R2v3 or e-Stewards certified</span>
        <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.5px] md:text-4xl md:leading-[42px] md:tracking-[-0.7px]">Recyclers</h1>
        <p className="text-[15px] leading-[21px] md:text-[17px] md:leading-[25px] md:text-muted">{PARTNERS.length} recycling partners</p>
      </header>

      <main className="p-in d1 flex flex-wrap items-start md:mt-6 md:gap-8">
        <section aria-label="Partners" className="w-full min-w-0 px-4 md:w-auto md:flex-[999_1_420px] md:border-t md:border-ink md:px-0">
          <div className="p-label hidden min-h-9 items-center border-b border-rule md:flex">Partner</div>
          <ul>
            {PARTNERS.map((name) => (
              <li key={name} className="flex min-h-14 items-center border-b border-rule text-base font-medium">
                {name}
              </li>
            ))}
          </ul>
        </section>

        <aside className="w-full min-w-0 px-4 py-6 md:w-auto md:flex-[1_1_280px] md:bg-forest md:p-5 md:text-white">
          <h2 className="p-label mb-2 md:mb-3 md:text-mint">Before you hand it in</h2>
          <ol className="border-t border-rule md:border-t-0">
            {PREP.map((text, i) => (
              <li key={text} className="flex gap-3.5 border-b border-rule-soft py-2.5 text-[15px] leading-[22px] md:gap-3 md:border-t md:border-b-0 md:border-rule-green">
                <span className="p-num text-[13px] font-medium text-forest md:font-normal md:text-mint">0{i + 1}</span>
                {text}
              </li>
            ))}
          </ol>
        </aside>
      </main>
    </div>
  );
}
