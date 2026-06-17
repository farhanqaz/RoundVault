import { ArrowRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import LiveStats from '@/components/LiveStats';
import { PACKAGE_ID } from '@/lib/config';
import { explorerPackage, shortenAddress } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="overflow-x-clip">
      <section className="relative min-h-[calc(100vh-72px)] px-4 py-10 sm:px-6 md:py-14 xl:px-10">
        <div className="orb left-[6%] top-[14%] h-64 w-64 bg-[var(--cyan)] opacity-35" />
        <div className="orb right-[10%] top-[20%] h-72 w-72 bg-[var(--blue)] opacity-30 [animation-delay:1.2s]" />
        <div className="orb bottom-[12%] left-[48%] h-60 w-60 bg-[var(--green)] opacity-20 [animation-delay:2.8s]" />

        <div className="relative mx-auto max-w-[1400px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)] lg:items-center xl:gap-10">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--cyan-soft)] px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[var(--cyan)] shadow-[var(--glow)]">
                <Image
                  src="/roundvault-mark.svg"
                  alt=""
                  width={20}
                  height={20}
                  unoptimized
                  className="h-5 w-5 rounded-md"
                />
                Powered by stake bonds
              </p>
              <h1 className="nansen-hero-title max-w-[900px] pb-3 text-6xl font-black leading-[1.04] tracking-[-0.07em] md:text-8xl lg:text-[6.45rem] xl:text-[7.1rem]">
                Surface The Savings Signal
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] xl:text-xl">
                Trustless rotating savings on Sui. No custodian touches the pot. Defaults get slashed.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/create" className="btn-primary inline-flex items-center justify-center gap-2">
                  Start a Vault <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/explore" className="btn-secondary inline-flex items-center justify-center">
                  Explore Vaults
                </Link>
              </div>
            </div>

            <div className="signal-panel w-full max-w-[470px] justify-self-center overflow-visible rounded-[2rem] p-3 lg:translate-y-1 xl:p-4">
              <div className="vault-core rounded-[1.5rem] border border-[var(--line)] bg-black/20">
                <div className="vault-label">RoundVault Core</div>
                <div className="vault-orbit">
                  <span className="vault-node" />
                  <span className="vault-node" />
                  <span className="vault-node" />
                  <span className="vault-node" />
                </div>
                <div className="vault-orbit" />
                <div className="vault-orbit" />
                <div className="vault-cube" />
                <div className="vault-rail" />
              </div>
              <div className="mt-3 rounded-[1.5rem] border border-[var(--line)] bg-black/25 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--cyan)]">Live protocol feed</p>
                <div className="mt-3">
                  <LiveStats />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <MiniSignal label="Commitment" value="Stake Bond" />
                <MiniSignal label="Payout" value="Gacha Draw" />
                <MiniSignal label="Penalty" value="Auto Slash" />
                <MiniSignal label="Identity" value="Rep Score" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 xl:px-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cyan)]">Discover</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] md:text-5xl">How winners are created</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
            The user flow is simple: lock collateral, pay rounds, draw winners from eligible members.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Create & Stake', 'Vault terms are public. Each member posts collateral before entering.'],
            ['02', 'Pay The Round', 'Contributions are visible on-chain and deadline-bound.'],
            ['03', 'Draw Or Slash', 'Winner selection is random; missed deadlines trigger slash logic.'],
          ].map(([step, title, body]) => (
            <div key={step} className="card">
              <p className="font-mono text-xs text-[var(--cyan)]">{step}</p>
              <h3 className="mt-4 text-xl font-black tracking-[-0.04em] xl:text-2xl">{title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 xl:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Persona title="Rina the freelancer" body="Auto-save every payout with peers. No organizer wallet holds group funds." />
          <Persona title="Dika the DAO contributor" body="Run a structured savings circle with public payment history and portable reputation." />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-6 xl:px-10">
        <h2 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">RoundVault vs the old rails</h2>
        <div className="signal-panel mt-8 overflow-x-auto rounded-[2rem]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[var(--faint)]">
              <tr className="border-b border-[var(--line)]">
                <th className="px-5 py-4 font-medium">Feature</th>
                <th className="px-5 py-4 font-medium text-[var(--cyan)]">RoundVault</th>
                <th className="px-5 py-4 font-medium">Arischain</th>
                <th className="px-5 py-4 font-medium">TrustArisan</th>
                <th className="px-5 py-4 font-medium">Informal</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Chain', 'Sui', 'Ethereum', 'BSC', 'Off-chain'],
                ['Onboarding', 'Sui Wallet', 'MetaMask', 'MetaMask', 'WhatsApp'],
                ['Default Protection', 'Stake slash', 'Partial', 'Unknown', 'Social pressure'],
                ['Gacha', 'Random on-chain', '-', '-', 'Manual'],
                ['Reputation', 'Portable wallet score', '-', '-', 'Private memory'],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-[var(--line)] last:border-0">
                  {row.map((cell, i) => (
                    <td key={`${row[0]}-${i}`} className={`px-5 py-4 ${i === 1 ? 'font-semibold text-[var(--cyan)]' : 'text-[var(--muted)]'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1400px] flex-col gap-3 border-t border-[var(--line)] px-4 py-10 text-sm text-[var(--muted)] sm:px-6 md:flex-row md:items-center md:justify-between xl:px-10">
        <span className="font-mono">Package {shortenAddress(PACKAGE_ID, 8)}</span>
        <a href={explorerPackage(PACKAGE_ID)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--cyan)]">
          Suiscan <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </footer>
    </div>
  );
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.025] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--faint)]">{label}</p>
      <p className="mt-2 text-sm font-black text-[var(--ink)] xl:text-base">{value}</p>
    </div>
  );
}

function Persona({ title, body }: { title: string; body: string }) {
  return (
    <div className="signal-panel rounded-[2rem] p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--cyan)]">Persona</p>
      <h3 className="mt-3 text-2xl font-black tracking-[-0.045em] xl:text-3xl">{title}</h3>
      <p className="mt-4 leading-7 text-[var(--muted)]">{body}</p>
    </div>
  );
}
