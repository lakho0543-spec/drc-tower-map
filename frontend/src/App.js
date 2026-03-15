import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import SiteTable from './components/SiteTable';
import AddSiteForm from './components/AddSiteForm';
import ImportData from './components/ImportData';
import TrashBin from './components/TrashBin';
import LayerManager from './components/LayerManager';
import DeleteModal from './components/DeleteModal';
import './App.css';

function App() {
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [sites, setSites] = useState([]);
  const [deletedSites, setDeletedSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState(['all']);
  const [provinces, setProvinces] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('map');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSites, setSelectedSites] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeLayers, setActiveLayers] = useState(['antennas']);
  const [dataTypes, setDataTypes] = useState([
    { id: 'antennas', name: 'Antennes', visible: true, color: '#1E3A8A', data: [] },
    { id: 'towers', name: 'Tours', visible: false, color: '#E63946', data: [] },
    { id: 'offices', name: 'Bureaux', visible: false, color: '#32CD32', data: [] },
    { id: 'future', name: 'Futurs sites', visible: false, color: '#FFA500', data: [] }
  ]);

  useEffect(() => {
    // Load main antenna data
    fetch('/data/tower-sites.json')
      .then(res => res.json())
      .then(data => {
        setSites(data);
        
        // Update dataTypes with antenna data - ensure other layers have empty arrays
        setDataTypes(prev => prev.map(type => 
          type.id === 'antennas' 
            ? { ...type, data: data } 
            : { ...type, data: [] } // Ensure other layers have empty arrays
        ));
        
        const uniqueOps = ['all', ...new Set(data.map(site => site.operator).filter(op => op))];
        setOperators(uniqueOps);
        const uniqueProvinces = ['all', ...new Set(data.map(site => site.province).filter(p => p))];
        setProvinces(uniqueProvinces);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
        showNotification('Erreur de chargement des données', 'error');
      });
  }, []);

  // Get all visible sites from all layers - SAFE VERSION
  const getAllVisibleSites = () => {
    let allSites = [];
    dataTypes.forEach(type => {
      if (type.visible && Array.isArray(type.data)) {
        allSites = [...allSites, ...type.data];
      }
    });
    return allSites;
  };

  const filteredSites = getAllVisibleSites().filter(site => {
    const matchesOperator = selectedOperator === 'all' || site.operator === selectedOperator;
    const matchesProvince = selectedProvince === 'all' || site.province === selectedProvince;
    const matchesSearch = searchTerm === '' || 
      (site.site_name && site.site_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (site.sap_id && site.sap_id.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesOperator && matchesProvince && matchesSearch;
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddSite = (newSite) => {
    const siteWithId = { ...newSite, id: sites.length + 1 };
    setSites([...sites, siteWithId]);
    
    // Also update in dataTypes
    setDataTypes(prev => prev.map(type => 
      type.id === 'antennas' ? { ...type, data: [...type.data, siteWithId] } : type
    ));
    
    showNotification('Site ajouté avec succès!');
  };

  const handleDeleteSites = () => {
    if (selectedSites.length === 0) {
      showNotification('Veuillez sélectionner des sites à supprimer', 'error');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Move to trash
    const sitesToDelete = sites.filter(site => selectedSites.includes(site.id));
    setDeletedSites([...deletedSites, ...sitesToDelete]);
    
    // Remove from main sites
    const newSites = sites.filter(site => !selectedSites.includes(site.id));
    setSites(newSites);
    
    // Update in dataTypes
    setDataTypes(prev => prev.map(type => 
      type.id === 'antennas' ? { ...type, data: newSites } : type
    ));
    
    setSelectedSites([]);
    setShowDeleteModal(false);
    showNotification(`${selectedSites.length} site(s) déplacé(s) vers la corbeille`);
  };

  const handleRestore = (siteIds) => {
    const sitesToRestore = deletedSites.filter(site => siteIds.includes(site.id));
    const updatedSites = [...sites, ...sitesToRestore];
    setSites(updatedSites);
    
    // Update in dataTypes
    setDataTypes(prev => prev.map(type => 
      type.id === 'antennas' ? { ...type, data: updatedSites } : type
    ));
    
    const remainingDeleted = deletedSites.filter(site => !siteIds.includes(site.id));
    setDeletedSites(remainingDeleted);
    
    showNotification(`${siteIds.length} site(s) restauré(s) avec succès!`);
  };

  const handlePermanentDelete = (siteIds) => {
    const remainingDeleted = deletedSites.filter(site => !siteIds.includes(site.id));
    setDeletedSites(remainingDeleted);
    showNotification(`${siteIds.length} site(s) supprimé(s) définitivement`);
  };

  const toggleSiteSelection = (siteId) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter(id => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
  };

  const selectAllSites = () => {
    if (selectedSites.length === filteredSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(filteredSites.map(site => site.id));
    }
  };

  const handleLayerToggle = (layers) => {
    setActiveLayers(layers.filter(l => l.visible).map(l => l.id));
    setDataTypes(layers);
  };

  const handleImport = (newData, dataType) => {
    // Add imported data to appropriate layer
    setDataTypes(prev => prev.map(type => 
      type.id === dataType ? { ...type, data: [...type.data, ...newData] } : type
    ));
    
    if (dataType === 'antennas') {
      setSites([...sites, ...newData]);
    }
    
    showNotification(`${newData.length} éléments importés avec succès!`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <img 
            src="/logo.png" 
            alt="Logo ARPTC" 
            style={{ 
              height: '60px',
              maxWidth: '100%'
            }} 
          />
          <h1>🇨🇩 RDC - Carte des Antennes Mobiles</h1>
        </div>
        <p className="subtitle">{filteredSites.length} sites affichés sur {getAllVisibleSites().length} total</p>
      </header>
      
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <LayerManager 
        layers={dataTypes}
        onLayerToggle={handleLayerToggle}
      />

      <div className="navigation-tabs">
        <button 
          className={`tab-btn ${currentView === 'map' ? 'active' : ''}`}
          onClick={() => setCurrentView('map')}
        >
          🗺️ Carte
        </button>
        <button 
          className={`tab-btn ${currentView === 'table' ? 'active' : ''}`}
          onClick={() => setCurrentView('table')}
        >
          📋 Tableau
        </button>
        <button 
          className={`tab-btn ${currentView === 'add' ? 'active' : ''}`}
          onClick={() => setCurrentView('add')}
        >
          ➕ Ajouter
        </button>
        <button 
          className={`tab-btn ${currentView === 'import' ? 'active' : ''}`}
          onClick={() => setCurrentView('import')}
        >
          📥 Importer
        </button>
        <button 
          className={`tab-btn ${currentView === 'trash' ? 'active' : ''}`}
          onClick={() => setCurrentView('trash')}
        >
          🗑️ Corbeille ({deletedSites.length})
        </button>
      </div>

      <div className="controls-container">
        <div className="filters-container">
          <div className="filter-group">
            <label>Opérateur:</label>
            <select 
              value={selectedOperator} 
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              {operators.map(op => (
                <option key={op} value={op}>
                  {op === 'all' ? 'Tous les opérateurs' : op}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Province:</label>
            <select 
              value={selectedProvince} 
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              {provinces.map(prov => (
                <option key={prov} value={prov}>
                  {prov === 'all' ? 'Toutes les provinces' : prov}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group search-group">
            <label>Recherche:</label>
            <input
              type="text"
              placeholder="Nom du site ou SAP ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary" 
            onClick={() => setCurrentView('add')}
          >
            ➕ Ajouter
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleDeleteSites}
          >
            🗑️ Supprimer ({selectedSites.length})
          </button>
        </div>
      </div>

      {currentView === 'map' && (
        <Map 
          sites={filteredSites} 
          selectedSites={selectedSites}
          onSiteSelect={toggleSiteSelection}
          // Remove activeLayers if Map component doesn't use it
        />
      )}

      {currentView === 'table' && (
        <SiteTable 
          sites={filteredSites}
          selectedSites={selectedSites}
          onSiteSelect={toggleSiteSelection}
          onSelectAll={selectAllSites}
        />
      )}

      {currentView === 'add' && (
        <AddSiteForm 
          onSubmit={handleAddSite}
          onCancel={() => setCurrentView('map')}
          operators={operators.filter(op => op !== 'all')}
          provinces={provinces.filter(p => p !== 'all')}
        />
      )}

      {currentView === 'import' && (
        <ImportData 
          onImport={handleImport}
          onCancel={() => setCurrentView('map')}
          dataTypes={dataTypes.map(t => t.id)}
        />
      )}

      {currentView === 'trash' && (
        <TrashBin 
          deletedSites={deletedSites}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          count={selectedSites.length}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <footer className="app-footer">
        <p>Autorité de régulation de la postes et des télécommunications du Congo</p>
        <p>© République Démocratique du Congo</p>
      </footer>
    </div>
  );
}

export default App;