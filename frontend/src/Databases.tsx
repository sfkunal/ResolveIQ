import React from 'react';

const Databases: React.FC = () => {
  const mockDatabases = [
    {
      name: 'Employee Records',
      status: 'Online',
      size: '3 TB',
      lastBackup: '2024-03-20 04:00 AM'
    },
    {
      name: 'Employee Settings',
      status: 'Online',
      size: '2 GB',
      lastBackup: '2024-03-20 04:00 AM'
    }
  ];

  return (
    <div className="databases">
      <h3>System Databases</h3>
      <div className="database-list">
        {mockDatabases.map(db => (
          <div key={db.name} className="database-item">
            <h4>{db.name}</h4>
            <div className="database-details">
              <p><strong>Status:</strong> <span className="status-online">{db.status}</span></p>
              <p><strong>Size:</strong> {db.size}</p>
              <p><strong>Last Backup:</strong> {db.lastBackup}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Databases; 