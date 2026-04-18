import Globe from 'react-globe.gl';
import { useRef, useEffect, useState, useMemo } from 'react';

// ────── DEFAULT RISK SCORES FOR ALL COUNTRIES ──────
const DEFAULT_COUNTRY_RISKS = {
  // CRITICAL ≥80
  'RU': 88, 'UA': 92, 'SY': 90, 'YE': 85, 'AF': 87, 'MM': 82, 'SO': 84, 'LY': 81, 'SD': 83, 'SS': 86, 'IQ': 80, 'KP': 89, 'PS': 85,
  // HIGH ≥60
  'IR': 75, 'PK': 68, 'CN': 72, 'IL': 70, 'LB': 73, 'ML': 65, 'BF': 63, 'NE': 62, 'TD': 61, 'CF': 66, 'CD': 67, 'ET': 64, 'ER': 60, 'HT': 69, 'VE': 62, 'NG': 61, 'MZ': 60,
  // MEDIUM ≥35
  'IN': 45, 'TR': 52, 'SA': 48, 'EG': 44, 'TH': 38, 'PH': 40, 'CO': 42, 'MX': 43, 'BR': 39, 'ZA': 37, 'KE': 41, 'TZ': 36, 'ID': 38, 'MY': 35, 'US': 42, 'GB': 36, 'FR': 37, 'DE': 35, 'IT': 36, 'ES': 35, 'PL': 40, 'RO': 38, 'HU': 39, 'RS': 45, 'BA': 42, 'XK': 48, 'GE': 50, 'AZ': 47, 'AM': 52, 'BY': 55, 'MD': 46, 'TN': 40, 'DZ': 42, 'MA': 36, 'JO': 38, 'KW': 37, 'BH': 36, 'QA': 35, 'AE': 35, 'OM': 35, 'TW': 55, 'KR': 40, 'JP': 36, 'VN': 37, 'LA': 36, 'KH': 37, 'BD': 42, 'LK': 40, 'NP': 38, 'UZ': 37, 'KG': 38, 'TJ': 39, 'TM': 36, 'KZ': 37, 'MN': 35, 'UG': 40, 'RW': 38, 'BI': 42, 'AO': 37, 'ZW': 43, 'PE': 39, 'BO': 38, 'EC': 40, 'GT': 39, 'HN': 38, 'SV': 37, 'NI': 41, 'CU': 48, 'DO': 36, 'JM': 35,
  // LOW <35
  'CA': 18, 'AU': 15, 'NZ': 12, 'NO': 10, 'SE': 11, 'FI': 14, 'DK': 12, 'IS': 8, 'IE': 13, 'CH': 10, 'AT': 14, 'BE': 16, 'NL': 15, 'LU': 10, 'PT': 14, 'GR': 20, 'CZ': 17, 'SK': 18, 'SI': 15, 'HR': 19, 'EE': 22, 'LV': 23, 'LT': 24, 'BG': 22, 'CY': 25, 'MT': 12, 'SG': 10, 'BN': 12, 'FJ': 10, 'PG': 25, 'CL': 20, 'UY': 14, 'CR': 12, 'PA': 16, 'TT': 18, 'BW': 15, 'NA': 14, 'MU': 12, 'SC': 10, 'MW': 28, 'MG': 30, 'SN': 25, 'GH': 22, 'CI': 28, 'CM': 32, 'GA': 20, 'CG': 28, 'GN': 30, 'SL': 32, 'LR': 33, 'TG': 29, 'BJ': 27, 'GM': 24, 'GW': 30, 'CV': 12, 'BT': 10, 'MV': 15, 'AR': 30, 'PY': 25,
};

const getCountryScore = (polygon, liveScores) => {
  const props = polygon.properties || {};
  const iso2 = props.ISO_A2 || '';
  const iso3 = props.ADM0_A3 || props.ISO_A3 || '';
  const fips = props.FIPS_10_ || '';

  return liveScores[iso2] || liveScores[iso3] || liveScores[fips]
    || DEFAULT_COUNTRY_RISKS[iso2] || DEFAULT_COUNTRY_RISKS[iso3]
    || 25; // LOW risk fallback
};

const getRiskColor = (score) => {
  if (score >= 80) return 'rgba(239, 68, 68, 1.0)';   // CRITICAL — Vibrant Red
  if (score >= 60) return 'rgba(255, 140, 0, 1.0)';    // HIGH — Vibrant Orange
  if (score >= 35) return 'rgba(59, 130, 246, 1.0)';   // MEDIUM — Vibrant Blue
  return 'rgba(34, 197, 94, 1.0)';                     // LOW — Vibrant Green
};

const MainGlobe = ({ gtiValue = 50, countryScores = {}, arcsData = [], onCountryClick }) => {
  const globeEl = useRef();
  
  const [countries, setCountries] = useState({ features: []});
  const [hoverD, setHoverD] = useState(null);

  useEffect(() => {
    // Load country polygons from local public folder (CORS safe)
    fetch('/countries.json')
      .then(res => res.json())
      .then(setCountries)
      .catch(err => console.error("Globe GeoJSON Error:", err));
  }, []);

  useEffect(() => {
    // Focus camera on Middle East / Asia axis on load (Command Center view)
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 25, lng: 55, altitude: 2.2 }, 3000);
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <Globe
      ref={globeEl}
      backgroundColor="#00000000" // Transparent
      showAtmosphere={true}
      atmosphereColor="#00D4FF"
      atmosphereAltitude={0.15}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-water.png"
      
      // Polygons (Countries)
      polygonsData={countries.features}
      polygonAltitude={d => d === hoverD ? 0.04 : 0.01}
      polygonCapColor={d => {
        const score = getCountryScore(d, countryScores);
        const col = getRiskColor(score);
        return d === hoverD ? col.replace('0.75', '1').replace('0.60', '1') : col;
      }}
      polygonSideColor={() => 'rgba(0, 0, 0, 0.5)'}
      polygonStrokeColor={() => '#111'}
      onPolygonHover={setHoverD}
      onPolygonClick={(d) => {
        if (d && d.properties) onCountryClick(d.properties.ADMIN || d.properties.NAME);
      }}

      // Custom Arcs for Trade/Sanction flow
      arcsData={arcsData}
      arcStartLat={d => d.startLat}
      arcStartLng={d => d.startLng}
      arcEndLat={d => d.endLat}
      arcEndLng={d => d.endLng}
      arcColor={d => d.color}
      arcDashLength={d => d.dashLength || 0.4}
      arcDashGap={d => d.dashGap || 0.2}
      arcDashAnimateTime={d => d.speed || 1500}
      arcAltitude={d => d.altitude || 0.3}
      arcStroke={d => d.thickness || 1.5}
    />
  );
};

export default MainGlobe;
