import re

with open('pages/Pulse.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all Arial with var(--font-body)
content = content.replace('"Arial, sans-serif"', '"var(--font-body)"')
content = content.replace("'Arial, sans-serif'", '"var(--font-body)"')

# Replace Space Mono with var(--font-mono)
content = content.replace("\"'Space Mono', monospace\"", '"var(--font-mono)"')
content = content.replace('fontFamily="Space Mono"', 'fontFamily="var(--font-mono)"')

# Change titles/labels to var(--font-display)
# We know the titles based on the text near them
display_patterns = [
    (r'(fontFamily:\s*)"var\(--font-mono\)"(,\s*fontSize:\s*10,\s*color:\s*\'#8892A0\',\s*marginBottom:\s*8,\s*letterSpacing:\s*\'0\.1em\',\s*textTransform:\s*\'uppercase\')', r'\1"var(--font-display)"\2'), # MetricCard title
    (r'(fontFamily:\s*)"var\(--font-mono\)"(,\s*fontSize:\s*10,\s*color:\s*\'#8892A0\',\s*letterSpacing:\s*\'0\.1em\'\s*\}\}>\s*INDIA RISK SCORE)', r'\1"var(--font-display)"\2'), # IRS title
    (r'(fontFamily:\s*)"var\(--font-mono\)"(,\s*fontSize:\s*10,\s*color:\s*\'#8892A0\',\s*letterSpacing:\s*\'0\.15em\',\s*marginBottom:\s*12\s*\}\}>\s*SECTOR HEATMAP)', r'\1"var(--font-display)"\2'), # Sector heatmap title
    (r'(fontFamily:\s*)"var\(--font-mono\)"(,\s*fontSize:\s*10,\s*color:\s*\'#8892A0\',\s*letterSpacing:\s*\'0\.15em\',\s*marginBottom:\s*16,\s*\}\}>\s*FII / DII FLOW)', r'\1"var(--font-display)"\2'), # FII Title
]

for p, r_str in display_patterns:
    content = re.sub(p, r_str, content)

# Update FII/DII disclaimer
old_fii_disclaimer = """              {fiiDii?.unavailable && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#FF8C00', marginTop: 8 }}>
                  NSE API unavailable — check back later
                </div>
              )}"""

new_fii_disclaimer = """              {fiiDii?.note === 'Volume proxy' ? (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#FFB347', marginTop: 4 }}>
                  Institutional proxy (volume-derived) — real FII data unavailable from cloud
                </div>
              ) : fiiDii?.unavailable ? (
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: '#FF8C00', marginTop: 8 }}>
                  NSE API unavailable — check back later
                </div>
              ) : null}"""

content = content.replace(old_fii_disclaimer, new_fii_disclaimer)

with open('pages/Pulse.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Pulse.jsx updated")
