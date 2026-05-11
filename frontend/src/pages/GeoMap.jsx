import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";
import Globe from "../components/globe/Globe";

export default function GeoMap() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.7fr_0.9fr]">
          <Section title="GLOBAL IMPACT OVERVIEW">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>Overall global impact: Elevated risk</div>
              <div>Top risks: Oil, geopolitical tensions, rates</div>
              <div>Impact score: 62 / 100</div>
            </div>
          </Section>

          <Section title="GLOBAL MACRO MAP">
            <div className="rounded-xl border border-[var(--border)] bg-[#0d1320] p-2">
              <Globe />
            </div>
          </Section>

          <Section title="REGION IMPACT SUMMARY">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Middle East</span><span className="text-[var(--red)]">74/100</span></div>
              <div className="flex justify-between"><span>China</span><span className="text-[var(--red)]">68/100</span></div>
              <div className="flex justify-between"><span>US</span><span className="text-[var(--yellow)]">56/100</span></div>
              <div className="flex justify-between"><span>Europe</span><span className="text-[var(--yellow)]">48/100</span></div>
            </div>
          </Section>
        </div>

        <Section title="REGION IMPACT DETAILS">
          <Grid cols={4}>
            {["Middle East", "China", "Europe", "US", "ASEAN", "Africa", "Australia", "Latin America"].map((region) => (
              <Card key={region} className="min-h-[160px]">
                <div className="text-sm font-semibold">{region}</div>
                <div className="mt-2 text-xs text-[var(--muted)]">Impact score and key event summary</div>
              </Card>
            ))}
          </Grid>
        </Section>
      </div>
    </Layout>
  );
}
