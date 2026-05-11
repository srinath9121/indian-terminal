import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Grid from "../components/ui/Grid";
import Section from "../components/ui/Section";

const alerts = [
  ["Crude Oil Prices Surge Above $85/barrel", "Commodities", "High", "10:15 AM"],
  ["RBI Maintains Repo Rate at 6.50%", "Macro Economy", "High", "10:00 AM"],
  ["FII Net Selling Continues", "FII/DII Activity", "High", "09:45 AM"],
  ["Nifty 50 Breaks Below Support", "Market Movement", "Medium", "09:30 AM"],
];

export default function Alerts() {
  return (
    <Layout>
      <div className="space-y-6">
        <Grid cols={4}>
          {[
            ["High Priority", "8"],
            ["Medium Priority", "12"],
            ["Low Priority", "15"],
            ["Total Alerts", "35"],
          ].map(([label, value]) => (
            <Card key={label}>
              <div className="text-xs text-[var(--muted)]">{label}</div>
              <div className="mt-2 text-3xl font-bold">{value}</div>
            </Card>
          ))}
        </Grid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.6fr_0.9fr]">
          <Section title="FILTER ALERTS">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <div>Priority filters</div>
              <div>Category filters</div>
              <div>Impact filters</div>
              <div>Status filters</div>
            </div>
          </Section>

          <Section title="ALL ALERTS">
            <div className="space-y-3">
              {alerts.map(([title, category, priority, time]) => (
                <div key={title} className="flex items-center justify-between border-b border-[var(--border)] pb-3 text-sm last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-white">{title}</div>
                    <div className="text-xs text-[var(--muted)]">{category}</div>
                  </div>
                  <div className="text-xs text-[var(--muted)]">{priority}</div>
                  <div className="text-xs text-[var(--muted)]">{time}</div>
                </div>
              ))}
            </div>
          </Section>

          <div className="space-y-6">
            <Section title="ALERT SUMMARY">
              <div className="flex h-[220px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#0d1320] text-sm text-[var(--muted)]">
                Donut / summary chart
              </div>
            </Section>

            <Section title="RECENTLY TRIGGERED">
              <div className="space-y-3 text-sm text-[var(--muted)]">
                <div>Crude Oil Prices Surge Above $85/barrel</div>
                <div>RBI Maintains Repo Rate at 6.50%</div>
                <div>FII Net Selling Continues</div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
