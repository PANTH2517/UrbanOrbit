import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveCity } from '../../config/cities';

// Real public satellite data from NASA GIBS (Global Imagery Browse Services) -
// no API key, no signup, updated daily/every 8 days by NASA. This is genuine
// remote-sensing data, not a trained segmentation model: MODIS/Terra Land
// Surface Temperature stands in for "heat islands" and MODIS/Terra NDVI
// (vegetation index) stands in for "green cover" - both are real proxies for
// those categories, not the citizen-report-derived AI overlays a production
// version would eventually train (see docs/SECURITY.md).
const GIBS_BASE = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const GIBS_ATTRIBUTION =
  'Imagery: NASA EOSDIS <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">GIBS</a> / MODIS Terra';

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const LAYERS = {
  urban_heat_islands: {
    label: "Land Surface Temperature",
    // LST doesn't support the literal "default" time keyword - use a recent
    // date with a few days of buffer for NASA's processing latency.
    url: `${GIBS_BASE}/MODIS_Terra_Land_Surface_Temp_Day/default/${daysAgo(3)}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
    maxNativeZoom: 7,
    legendTitle: "Land Surface Temperature",
    legendNote: "NASA MODIS/Terra, updated daily - warmer colors = hotter surface",
  },
  green_inequality: {
    label: "Vegetation Index (NDVI)",
    url: `${GIBS_BASE}/MODIS_Terra_NDVI_8Day/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`,
    maxNativeZoom: 9,
    legendTitle: "Vegetation Index (NDVI)",
    legendNote: "NASA MODIS/Terra, 8-day composite - greener = denser vegetation cover",
  },
};

function GibsLegend({ config }) {
  const map = useMap();

  useEffect(() => {
    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "thermal-legend bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-[220px]");
      div.innerHTML = `
        <h4 class="font-bold text-sm mb-1 text-slate-700">${config.legendTitle}</h4>
        <p class="text-[11px] text-slate-600 leading-snug">${config.legendNote}</p>
        <p class="text-[10px] text-slate-500 mt-1">Real public satellite data - not an AI-trained overlay.</p>
      `;
      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map, config]);

  return null;
}

export default function ThermalHeatMap({ selectedProblem, height = "500px" }) {
  const city = getActiveCity();
  const config = LAYERS[selectedProblem] || LAYERS.urban_heat_islands;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(56,242,255,0.08)]" style={{ height, background: "#0a0e1f" }}>
      <MapContainer
        center={city.center}
        zoom={city.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        {/* Real satellite true-color base, not the street basemap - this view is
            explicitly about remote-sensing data, so it should look like it. */}
        <TileLayer
          url={`${GIBS_BASE}/MODIS_Terra_CorrectedReflectance_TrueColor/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`}
          maxNativeZoom={9}
          attribution={GIBS_ATTRIBUTION}
        />
        <TileLayer
          key={selectedProblem}
          url={config.url}
          maxNativeZoom={config.maxNativeZoom}
          opacity={0.75}
          attribution={GIBS_ATTRIBUTION}
        />

        <GibsLegend config={config} />
      </MapContainer>
    </div>
  );
}
