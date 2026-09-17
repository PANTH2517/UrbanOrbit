import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getActiveCity } from '../../config/cities';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Defaults to OpenStreetMap's free public tile server (fine for dev/demo,
// not meant for real production traffic). Set VITE_MAP_TILE_URL /
// VITE_MAP_TILE_ATTRIBUTION to switch to a paid provider before real launch
// - see .env.example.
const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const problemMetadata = {
  slum_watch: { color: '#ef4444', icon: '🏘️', label: 'Slum Watch' },
  urban_heat_islands: { color: '#f97316', icon: '🌡️', label: 'Heat Islands' }, 
  pollution_zones: { color: '#84cc16', icon: '🏭', label: 'Pollution Zones' },
  disaster_chaos: { color: '#dc2626', icon: '⚠️', label: 'Disaster Areas' },
  power_deprivation: { color: '#eab308', icon: '⚡', label: 'Power Issues' },
  crime_mapping: { color: '#8b5cf6', icon: '🚔', label: 'Crime Mapping' },
  green_inequality: { color: '#10b981', icon: '🌳', label: 'Green Spaces' },
  transit_gaps: { color: '#06b6d4', icon: '🚌', label: 'Transit Gaps' },
  land_use_violations: { color: '#f59e0b', icon: '🏗️', label: 'Land Use' },
  infra_inequality: { color: '#6366f1', icon: '🏗️', label: 'Infrastructure' }
};

const createCustomIcon = (problemType, status = 'pending') => {
  const color = problemMetadata[problemType]?.color || '#6366f1';
  const icon = problemMetadata[problemType]?.icon || '📍';
  const opacity = status === 'completed' ? 0.5 : 1;
  const pulseClass = status === 'pending' ? 'animate-pulse' : '';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        opacity: ${opacity};
      " class="${pulseClass}">
        <span style="transform: rotate(45deg); font-size: 16px;">${icon}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });
};

function MapEvents({ onMapClick }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapClick) {
      map.on('click', onMapClick);
      return () => map.off('click', onMapClick);
    }
  }, [map, onMapClick]);

  return null;
}

export default function UrbanMap({ 
  issues = [], 
  selectedProblem = null,
  onMapClick = null,
  clickMarker = null,
  height = "500px"
}) {
  const filteredIssues = (selectedProblem 
    ? issues.filter(issue => issue.problem_type === selectedProblem)
    : issues
  ).filter(issue => issue.latitude != null && issue.longitude != null);

  const city = getActiveCity();

  return (
    <div className="uo-dark-tiles rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(56,242,255,0.08)]" style={{ height }}>
      <MapContainer
        center={city.center}
        zoom={city.zoom}
        // Off by default - otherwise scrolling the page while the cursor
        // happens to pass over the map hijacks the scroll into a map zoom
        // instead. Zoom is still available via the +/- controls,
        // double-click, and pinch-to-zoom on touch.
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        <MapEvents onMapClick={onMapClick} />

        {/* Click marker */}
        {clickMarker?.lat != null && clickMarker?.lng != null && (
          <Marker 
            position={[clickMarker.lat, clickMarker.lng]}
            icon={L.divIcon({
              className: 'click-marker',
              html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13]
            })}
          >
            <Popup>
              <div className="text-center p-2">
                <p className="font-semibold">New Issue Location</p>
                <p className="text-sm text-gray-600">
                  Lat: {clickMarker.lat.toFixed(6)}<br/>
                  Lng: {clickMarker.lng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Issue markers */}
        {filteredIssues.map(issue => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createCustomIcon(issue.problem_type, issue.status)}
          >
            <Popup maxWidth={300} className="issue-popup">
              <div className="p-3">
                <h3 className="font-semibold text-lg mb-2 text-slate-800">
                  {issue.title}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">Type:</span>
                    <span className="ml-2 capitalize">
                      {issue.problem_type?.replace(/_/g, ' ') ?? 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      issue.status === 'completed' ? 'bg-green-100 text-green-800' :
                      issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {issue.status?.replace('_', ' ') ?? 'Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Description:</span>
                    <p className="mt-1 text-slate-700">{issue.description}</p>
                  </div>
                  {issue.image_url && (
                    <div className="mt-3">
                      <img 
                        src={issue.image_url} 
                        alt="Issue" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-2 pt-2 border-t">
                    Reported: {new Date(issue.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
