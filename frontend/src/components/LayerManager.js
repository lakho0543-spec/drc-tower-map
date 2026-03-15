import React from 'react';

const LayerManager = ({ layers = [], onLayerToggle }) => {
  // Add default empty array and safety checks
  
  const toggleLayer = (layerId) => {
    if (!layers || !Array.isArray(layers)) return;
    
    const updated = layers.map(l => 
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    onLayerToggle(updated);
  };

  // Safety check
  if (!layers || !Array.isArray(layers) || layers.length === 0) {
    return (
      <div className="layer-manager">
        <h4>🗺️ Couches de données</h4>
        <p className="loading-text">Chargement des couches...</p>
      </div>
    );
  }

  return (
    <div className="layer-manager">
      <h4>🗺️ Couches de données</h4>
      {layers.map(layer => (
        <label key={layer.id} className="layer-item">
          <input 
            type="checkbox" 
            checked={layer.visible || false}
            onChange={() => toggleLayer(layer.id)}
          />
          <span style={{ color: layer.color || '#000', marginRight: '5px' }}>●</span>
          {layer.name || 'Couche'}
          <span className="layer-count">({layer.data?.length || 0})</span>
        </label>
      ))}
    </div>
  );
};

export default LayerManager;