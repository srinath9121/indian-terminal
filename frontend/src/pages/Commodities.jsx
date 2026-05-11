import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";

export default function Commodities() {
  return (
    <Layout>
      <div className="space-y-6">
        <Grid cols={4}>
          {["Brent Crude", "WTI", "Natural Gas", "Gold", "Silver", "Copper", "Aluminium", "Nickel"].map((x) => (
            <Card key={x}>
              <div className="text-xs text-[var(--muted)]">{x}</div>
              <div className="mt-2 text-2xl font-bold">--</div>
            </Card>
          ))}
        </Grid>

        <Grid cols={3}>
          <Section title="COMMODITY PERFORMANCE">
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div>Gold +0.69%</div>
              <div>Copper +0.84%</div>
              <div>Silver +0.74%</div>
              <div>Brent -1.49%</div>
            </div>
          </Section>

          <Section title="COMMODITY TRENDS">
            <div className="flex h-[260px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d1320] text-sm text-[var(--muted)]">
              Trend chart placeholder
            </div>
          </Section>

          <Section title="COMMODITY SUMMARY">
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <div>Crude weak on demand concerns</div>
              <div>Gold supported by geopolitics</div>
              <div>Copper mixed on supply pressure</div>
            </div>
          </Section>
        </Grid>
      </div>
    </Layout>
  );
}
