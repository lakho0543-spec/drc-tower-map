import React, { useState } from 'react';

const TrashBin = ({ deletedSites, onRestore, onPermanentDelete }) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const selectAll = () => {
    if (selectedItems.length === deletedSites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(deletedSites.map(site => site.id));
    }
  };

  return (
    <div className="trash-container">
      <div className="trash-header">
        <h2>🗑️ Corbeille</h2>
        <div>
          <button className="btn btn-outline" onClick={selectAll}>
            {selectedItems.length === deletedSites.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
      </div>

      {deletedSites.length === 0 ? (
        <p className="empty-trash">La corbeille est vide</p>
      ) : (
        <>
          <p className="trash-info">{deletedSites.length} site(s) dans la corbeille</p>
          
          <div className="table-responsive">
            <table className="site-table">
              <thead>
                <tr>
                  <th>Sélectionner</th>
                  <th>SAP ID</th>
                  <th>Nom du site</th>
                  <th>Opérateur</th>
                  <th>Province</th>
                </tr>
              </thead>
              <tbody>
                {deletedSites.map(site => (
                  <tr key={site.id} className={selectedItems.includes(site.id) ? 'selected-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(site.id)}
                        onChange={() => toggleSelect(site.id)}
                      />
                    </td>
                    <td>{site.sap_id}</td>
                    <td>{site.site_name}</td>
                    <td>{site.operator}</td>
                    <td>{site.province}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="trash-actions">
            <button 
              className="btn btn-success" 
              onClick={() => onRestore(selectedItems)}
              disabled={selectedItems.length === 0}
            >
              ♻️ Restaurer ({selectedItems.length})
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => {
                if (window.confirm('Supprimer définitivement ces sites ?')) {
                  onPermanentDelete(selectedItems);
                  setSelectedItems([]);
                }
              }}
              disabled={selectedItems.length === 0}
            >
              🗑️ Supprimer définitivement
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TrashBin;