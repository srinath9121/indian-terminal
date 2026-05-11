import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";

export default function Markets() {
  return (
    <Layout>
      <div className="space-y-6">
        <Grid cols={5}>
          {["NIFTY 50", "SENSEX", "BANKNIFTY", "NIFTY NEXT 50", "INDIA VIX"].map((x) => (
            <Card key={x}>
              <div className="text-xs text-[var(--muted)]">{x}</div>
              <div className="mt-2 text-2xl font-bold">--</div>
            </Card>
          ))}
        </Grid>

        <Grid cols={3}>
          <Section title="SECTOR PERFORMANCE">
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div>IT +1.42%</div>
              <div>FMCG +1.18%</div>
              <div>BANK +0.83%</div>
              <div>AUTO +0.55%</div>
            </div>
          </Section>

          <Section title="TOP GAINERS">
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div>TATATECH</div>
              <div>INFY</div>
              <div>HCLTECH</div>
              <div>WIPRO</div>
            </div>
          </Section>

          <Section title="TOP LOSERS">
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div>M&M</div>
              <div>ADANIPORTS</div>
              <div>JSWSTEEL</div>
              <div>BPCL</div>
            </div>
          </Section>
        </Grid>

        <Grid cols={3}>
          <Section title="FII / DII ACTIVITY">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>FII net: -₹2,345 Cr</div>
              <div>DII net: +₹3,862 Cr</div>
            </div>
          </Section>

          <Section title="DERIVATIVES SNAPSHOT">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>NIFTY PCR</div>
              <div>BANKNIFTY PCR</div>
              <div>Max pain</div>
            </div>
          </Section>

          <Section title="GLOBAL INDICES">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>S&P 500</div>
              <div>NASDAQ</div>
              <div>DOW JONES</div>
              <div>FTSE 100</div>
            </div>
          </Section>
        </Grid>
      </div>
    </Layout>
  );
}
