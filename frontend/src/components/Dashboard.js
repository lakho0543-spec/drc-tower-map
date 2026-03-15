import React from 'react';

const Dashboard = ({ sites }) => {
  const totalSites = sites.length;
  const operators = [...new Set(sites.map(s => s.operator))];
  const provinces = [...new Set(sites.map(s => s.province))];
  const withTowers = sites.filter(s => s.has_tower).length;
  const avgHeight = sites.filter(s => s.height).reduce((a, b) => a + b.height, 0) / sites.filter(s => s.height).length;

  return (
    <div className="dashboard">
      <h2>📊 Tableau de Bord</h2>
      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>📡 Sites Totaux</h3>
          <p className="stat-number">{totalSites.toLocaleString()}</p>
        </div>
        <div className="stat-card red">
          <h3>🏢 Opérateurs</h3>
          <p className="stat-number">{operators.length}</p>
        </div>
        <div className="stat-card green">
          <h3>🗺️ Provinces</h3>
          <p className="stat-number">{provinces.length}</p>
        </div>
        <div className="stat-card orange">
          <h3>📶 Tours</h3>
          <p className="stat-number">{withTowers.toLocaleString()}</p>
        </div>
      </div>
      <div className="chart-container">
        {/* Add charts here */}
      </div>
    </div>
  );
};