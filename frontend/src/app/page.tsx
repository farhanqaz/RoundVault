import Link from 'next/link';
import LiveStats from '@/components/LiveStats';
import { PACKAGE_ID } from '@/lib/config';
import { explorerPackage } from '@/lib/utils';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-400">
            DeFi & Payments · Sui Overflow 2026
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
            No custodian holds the pot.
            <br />
            <span className="bg-gradient-to-r from-zinc-400 to-zinc-600 bg-clip-text text-transparent">
              Defaults get slashed.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            RoundVault puts rotating savings clubs on Sui. Members stake collateral,
            contribute each round, and one random member wins the pot each round — enforced by
            smart contract, not trust.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/create" className="btn-primary">
              Create Savings Vault
            </Link>
            <Link href="/explore" className="btn-secondary">
              Explore vaults
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-zinc-600">
            Package{' '}
            <a
              href={explorerPackage(PACKAGE_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-emerald-400"
            >
              {PACKAGE_ID.slice(0, 10)}…
            </a>
            · Sui Testnet
          </p>
        </div>
      </section>

      <LiveStats />

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-zinc-100">Two ways informal savings fail</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="card">
            <span className="text-2xl">🏃</span>
            <h3 className="mt-3 font-semibold text-zinc-100">Custodian runs</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              The organizer holds the pot off-chain. When they disappear, everyone loses.
              RoundVault locks funds in a shared object — no human wallet ever custodies the pot.
            </p>
          </div>
          <div className="card">
            <span className="text-2xl">👻</span>
            <h3 className="mt-3 font-semibold text-zinc-100">Member defaults</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Someone receives their payout, then stops contributing. Social pressure fails.
              RoundVault slashes stake bonds — defaults have on-chain consequences.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-zinc-800 bg-zinc-900/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-zinc-100">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Form & stake',
                desc: 'Create a vault with contribution size and payout order. Each member joins by posting a stake bond.',
              },
              {
                step: '02',
                title: 'Contribute',
                desc: 'Every round, members pay their share into the on-chain pot. Progress is visible to everyone.',
              },
              {
                step: '03',
                title: 'Gacha draw or slash',
                desc: 'When all contribute, a random eligible member wins the pot on-chain. Miss the deadline? Stake gets slashed.',
              },
            ].map((item) => (
              <div key={item.step} className="card">
                <span className="font-mono text-xs text-emerald-400">{item.step}</span>
                <h3 className="mt-2 font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portable reputation */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
              Shipped on testnet
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-100 sm:text-3xl">
              Portable on-chain reputation
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Every join, contribution, payout, and slash updates a global score tied to your
              wallet — not one vault. Before you join a circle, check who has a track record.
              Good behavior compounds across every RoundVault you enter.
            </p>
            <Link
              href="/leaderboard"
              className="mt-6 inline-flex text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View reputation leaderboard ↗
            </Link>
          </div>

          <div className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums text-emerald-400">215</span>
              <span className="text-sm text-zinc-500">example score</span>
            </div>
            <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/25 ring-inset">
              Reliable
            </span>
            <ul className="mt-6 space-y-2.5 text-sm text-zinc-400">
              {[
                ['Join a vault', '+5'],
                ['Contribute a round', '+10'],
                ['Receive payout', '+30'],
                ['Complete vault (withdraw stake)', '+100'],
                ['Get slashed', '−200'],
              ].map(([action, pts]) => (
                <li key={action} className="flex items-center justify-between gap-4">
                  <span>{action}</span>
                  <span
                    className={`shrink-0 font-mono text-xs font-medium ${
                      pts.startsWith('−') ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {pts}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
              Connect wallet → <strong className="font-medium text-zinc-500">Reputation</strong> in
              the header, or view any member&apos;s score on a vault dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-zinc-100">Built for real people</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              who: 'Freelancer circles',
              story:
                'Five designers save 100 USDC weekly. Each month, one person receives the full pot — no group admin holding funds.',
            },
            {
              who: 'DAO contributors',
              story:
                'Treasury streams to members in rotating order. Every payout is verifiable on-chain for governance audits.',
            },
            {
              who: 'Family savings',
              story:
                'Relatives abroad join the same vault. Stake bonds replace awkward WhatsApp reminders to pay up.',
            },
          ].map((p) => (
            <div key={p.who} className="card">
              <h3 className="font-semibold text-emerald-400">{p.who}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.story}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiation */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-zinc-100">Why RoundVault on Sui</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="pb-3 pr-4 font-medium">Capability</th>
                  <th className="pb-3 pr-4 font-medium text-emerald-400">RoundVault</th>
                  <th className="pb-3 font-medium">Informal / Excel</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {[
                  ['Pot held by contract, not person', '✓', '✗'],
                  ['Default enforcement (stake slash)', '✓', '✗'],
                  ['Atomic round distribution (PTB)', '✓', '✗'],
                  ['Public audit trail', '✓', 'Partial'],
                  ['Portable reputation across vaults', '✓', '✗'],
                ].map(([cap, rv, other]) => (
                  <tr key={cap} className="border-b border-zinc-800/60">
                    <td className="py-3 pr-4 text-zinc-300">{cap}</td>
                    <td className="py-3 pr-4 text-emerald-400">{rv}</td>
                    <td className="py-3">{other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <blockquote className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
          <p className="text-lg italic leading-relaxed text-zinc-300">
            &ldquo;$1 trillion flows through informal rotating savings clubs every year.
            All of it runs on trust. RoundVault makes it trustless.&rdquo;
          </p>
        </blockquote>
        <Link href="/create" className="btn-primary mt-10 inline-flex">
          Start a vault on testnet
        </Link>
      </section>
    </div>
  );
}
