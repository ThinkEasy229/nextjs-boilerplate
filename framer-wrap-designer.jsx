import React, { useState } from 'react';

const VehicleWrapDesigner = () => {
  const [vehicleType, setVehicleType] = useState('');
  const [designDirection, setDesignDirection] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('https://nextjs-boilerplate-wrap-lab.vercel.app/api/wrap-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleType,
          designDirection,
          companyName,
          contactEmail
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate');
        return;
      }

      setResult(data.data);
      setVehicleType('');
      setDesignDirection('');
      setCompanyName('');
      setContactEmail('');
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Vehicle Wrap Designer</h1>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#f5f5f5', padding: '30px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Vehicle Type</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Select a vehicle...</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="trailer">Trailer</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Design Direction</label>
          <input
            type="text"
            value={designDirection}
            onChange={(e) => setDesignDirection(e.target.value)}
            placeholder="e.g., Modern, Bold, Colorful"
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Design'}
        </button>
      </form>

      {error && <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f8ff', border: '2px solid #0066cc', borderRadius: '8px' }}>
          <h2>Design Created!</h2>
          {result.imageUrl && <img src={result.imageUrl} alt="Wrap" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />}
          <h3>{result.conceptTitle}</h3>
          <p>{result.creativeRationale}</p>
        </div>
      )}
    </div>
  );
};

export default VehicleWrapDesigner;
