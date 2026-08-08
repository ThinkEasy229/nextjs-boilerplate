import React, { useState } from 'react';

const DEFAULT_API_URL = 'https://nextjs-boilerplate-wrap-lab.vercel.app/api/wrap-concept';

const cardStyle = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const fieldLabelStyle = { display: 'block', marginBottom: '8px', fontWeight: 600 };
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  boxSizing: 'border-box',
};

export default function VehicleWrapDesigner({ apiUrl = DEFAULT_API_URL, title = 'AI Vehicle Wrap Designer' }) {
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [designDirection, setDesignDirection] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [preferredColors, setPreferredColors] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setVehicleType('');
    setVehicleYear('');
    setVehicleMake('');
    setVehicleModel('');
    setDesignDirection('');
    setCompanyName('');
    setContactEmail('');
    setIndustry('');
    setPreferredColors('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleType,
          vehicleYear,
          vehicleMake,
          vehicleModel,
          designDirection,
          companyName,
          contactEmail,
          industry,
          preferredColors,
        }),
      });

      const payload = await response.json().catch(() => ({ error: 'Invalid server response' }));

      if (!response.ok) {
        setError(payload.error || 'Failed to generate a design concept');
        return;
      }

      setResult({
        imageUrl: payload?.data?.imageUrl || payload?.imageUrl,
        conceptTitle: `${vehicleYear} ${vehicleMake} ${vehicleModel} Wrap Concept`,
        creativeDirections: [
          payload?.data?.creativeDirectionOne,
          payload?.data?.creativeDirectionTwo,
          payload?.data?.creativeDirectionThree,
        ].filter(Boolean),
      });
      resetForm();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unexpected request error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, marginBottom: '18px' }}>{title}</h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
        <div>
          <label style={fieldLabelStyle}>Vehicle Type</label>
          <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)} required style={inputStyle}>
            <option value="">Select a vehicle...</option>
            <option value="cargo-van">Cargo Van</option>
            <option value="box-truck">Box Truck</option>
            <option value="sedan">Sedan</option>
            <option value="city-bus">City Bus</option>
            <option value="semi-truck">Semi Truck</option>
            <option value="pickup">Pickup Truck</option>
          </select>
        </div>

        <div>
          <label style={fieldLabelStyle}>Vehicle Year</label>
          <input
            type="text"
            value={vehicleYear}
            onChange={(event) => setVehicleYear(event.target.value)}
            placeholder="2024"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Vehicle Make</label>
          <input
            type="text"
            value={vehicleMake}
            onChange={(event) => setVehicleMake(event.target.value)}
            placeholder="Ford"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Vehicle Model</label>
          <input
            type="text"
            value={vehicleModel}
            onChange={(event) => setVehicleModel(event.target.value)}
            placeholder="Transit"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Industry</label>
          <input
            type="text"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Commercial fleet branding"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Preferred Colors</label>
          <input
            type="text"
            value={preferredColors}
            onChange={(event) => setPreferredColors(event.target.value)}
            placeholder="Navy, electric blue, orange"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Design Direction</label>
          <input
            type="text"
            value={designDirection}
            onChange={(event) => setDesignDirection(event.target.value)}
            placeholder="Modern, bold, premium, minimal..."
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabelStyle}>Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="name@company.com"
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '8px',
            padding: '12px 14px',
            border: 0,
            borderRadius: '8px',
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating…' : 'Generate Wrap Concept'}
        </button>
      </form>

      {error ? (
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <section style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
          {result.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.imageUrl}
              alt={result.conceptTitle || 'Vehicle wrap concept image'}
              style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }}
            />
          ) : null}
          <h3 style={{ marginTop: 0 }}>{result.conceptTitle}</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {result.creativeDirections?.map((direction, index) => (
              <p key={direction} style={{ margin: 0 }}>
                <strong>Direction {index + 1}:</strong> {direction}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
