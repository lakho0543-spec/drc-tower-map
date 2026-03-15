import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;

// Color mapping for operators
const operatorColors = {
  'Vodacom': '#E63946',
  'Airtel': '#1E3A8A',
  'Orange': '#FFA500',
  'Africell': '#32CD32',
  'Helios': '#800080',
  'East-Castle': '#FFD700',
  'TOA': '#00CED1'
};

// Beautiful marker icons with glass effect
const getBeautifulIcon = (operator, isSelected) => {
  const color = operatorColors[operator] || '#3388ff';
  const size = isSelected ? 36 : 32;
  
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <!-- Glow effect -->
        <div style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: ${size + 8}px;
          height: ${size + 8}px;
          background: radial-gradient(circle, ${color}40, transparent 70%);
          border-radius: 50%;
          filter: blur(4px);
          animation: pulse 2s infinite;
        "></div>
        
        <!-- Antenna icon -->
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <!-- Antenna pole -->
          <rect x="11" y="4" width="2" height="12" fill="${color}" rx="1"/>
          <!-- Antenna base -->
          <circle cx="12" cy="17" r="3" fill="${color}" stroke="white" stroke-width="1.5"/>
          <!-- Signal rings -->
          <circle cx="12" cy="12" r="4" stroke="${color}" stroke-width="1" fill="none" opacity="0.4"/>
          <circle cx="12" cy="12" r="7" stroke="${color}" stroke-width="1" fill="none" opacity="0.2"/>
          ${isSelected ? `
          <circle cx="12" cy="12" r="10" stroke="#FF0000" stroke-width="2" fill="none" stroke-dasharray="4 4"/>
          ` : ''}
        </svg>
      </div>
    `,
    className: 'beautiful-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Map Controls Component (simplified)
function MapControls({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    // Add scale control
    L.control.scale({ 
      imperial: false, 
      metric: true, 
      position: 'bottomleft'
    }).addTo(map);
  }, [map]);

  return null;
}

// Legend Component
function MapLegend({ zoomLevel, visibleLayers = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`map-legend ${collapsed ? 'collapsed' : ''}`}>
      <div className="legend-header" onClick={() => setCollapsed(!collapsed)}>
        <span>🗺️ Légende</span>
        <span>{collapsed ? '▼' : '▲'}</span>
      </div>
      
      {!collapsed && (
        <div className="legend-content">
          <div className="zoom-info">Niveau de zoom: {zoomLevel}</div>
          
          <h4>Opérateurs</h4>
          {Object.entries(operatorColors).map(([op, color]) => (
            <div key={op} className="legend-item">
              <span className="color-dot" style={{ backgroundColor: color }}></span>
              <span>{op}</span>
            </div>
          ))}
          
          {visibleLayers.length > 0 && (
            <>
              <h4>Couches actives</h4>
              <div className="layers-badge">
                {visibleLayers.map(layer => (
                  <span key={layer} className="layer-badge">{layer}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Popup Component
const BeautifulPopup = ({ site, isSelected, onSiteSelect }) => {
  const color = operatorColors[site.operator] || '#1E3A8A';
  
  return (
    <div className="site-popup">
      <h3 style={{ color, borderBottom: `2px solid ${color}` }}>{site.site_name}</h3>
      <p><strong>SAP ID:</strong> {site.sap_id}</p>
      <p><strong>Opérateur:</strong> {site.operator}</p>
      <p><strong>Province:</strong> {site.province}</p>
      <p><strong>Type:</strong> {site.type}</p>
      <p><strong>Catégorie:</strong> {site.category}</p>
      <p><strong>Infrastructure:</strong> {site.infrastructure}</p>
      <p><strong>Tour:</strong> {site.has_tower ? 'Oui' : 'Non'}</p>
      {site.height && <p><strong>Hauteur:</strong> {site.height}m</p>}
      <p><strong>Date:</strong> {site.on_air_date}</p>
      <p><strong>Coords:</strong> {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}</p>
      <button 
        className="btn-select"
        onClick={() => onSiteSelect(site.id)}
        style={{ backgroundColor: color }}
      >
        {isSelected ? '✓ Désélectionner' : '+ Sélectionner'}
      </button>
    </div>
  );
};

// Main Map Component
const Map = ({ sites = [], selectedSites = [], onSiteSelect, dataTypes = [], onLayerToggle }) => {
  const [zoomLevel, setZoomLevel] = useState(6);
  const [mapStyle, setMapStyle] = useState('streets');
  const position = [-2.5, 23.5];

  const mapStyles = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  // Safe calculation of visible layers
  const visibleLayers = dataTypes && Array.isArray(dataTypes) 
    ? dataTypes.filter(l => l && l.visible).map(l => l.name || 'Couche')
    : [];

  return (
    <div className="map-wrapper">
      {/* Map Style Selector */}
      <div className="map-style-selector">
        <button 
          className={mapStyle === 'streets' ? 'active' : ''}
          onClick={() => setMapStyle('streets')}
        >
          🏙️ Rues
        </button>
        <button 
          className={mapStyle === 'satellite' ? 'active' : ''}
          onClick={() => setMapStyle('satellite')}
        >
          🛰️ Satellite
        </button>
        <button 
          className={mapStyle === 'terrain' ? 'active' : ''}
          onClick={() => setMapStyle('terrain')}
        >
          ⛰️ Terrain
        </button>
      </div>

      <MapLegend zoomLevel={zoomLevel} visibleLayers={visibleLayers} />
      
      <div className="stats-badge">
        <span>📊 {sites.length} sites</span>
      </div>

      <MapContainer 
        center={position} 
        zoom={6} 
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
      >
        <ZoomControl position="bottomright" />
        <MapControls onZoomChange={setZoomLevel} />
        
        <TileLayer
          url={mapStyles[mapStyle]}
          attribution='&copy; OpenStreetMap'
        />
        
        {sites && sites.map((site) => {
          if (!site) return null;
          const isSelected = selectedSites.includes(site.id);
          return (
            <Marker 
              key={site.id} 
              position={[site.latitude, site.longitude]}
              icon={getBeautifulIcon(site.operator, isSelected)}
              eventHandlers={{
                click: () => onSiteSelect(site.id)
              }}
            >
              <Popup>
                <BeautifulPopup 
                  site={site}
                  isSelected={isSelected}
                  onSiteSelect={onSiteSelect}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;