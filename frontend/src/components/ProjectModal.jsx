import React, { useState } from 'react';
import '../styles/Modal.css';

function ProjectModal({ show, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onCreate({ name, description });
      setName('');
      setDescription('');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10 }}
          />
          <textarea
            placeholder="Project Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={3}
            style={{ width: '100%', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} >Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectModal;
