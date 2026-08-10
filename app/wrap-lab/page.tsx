'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const VEHICLES = [
  { id: 'cargo-van', label: 'Cargo Van', make: 'Ford', model: 'Transit', year: '2024', emoji: '🚐' },
  { id: 'box-truck', label: 'Box Truck', make: 'Isuzu', model: 'NPR', year: '2024', emoji: '🚛' },
  { id: 'company-car', label: 'Company Car', make: 'Toyota', model: 'Camry', year: '2024', emoji: '🚗' },
  { id: 'transit-bus', label: 'Transit Bus', make: 'Blue Bird', model: 'All American', year: '2024', emoji: '🚌' },
  { id: 'semi-truck', label: 'Semi Truck', make: 'Freightliner', model: 'Cascadia', year: '2024', emoji: '🚚' },
  { id: 'pickup-truck', label: 'Pickup Truck', make: 'Chevrolet', model: 'Silverado', year: '2024', emoji: '🛻' },
  { id: 'ferrari', label: 'Ferrari', make: 'Ferrari', model: '488 GTB', year: '2024', emoji: '🏎️' },
  { id: 'lamborghini', label: 'Lamborghini', make: 'Lamborghini', model: 'Huracán', year: '2024', emoji: '🏎️' },
  { id: 'tesla', label: 'Tesla Model S', make: 'Tesla', model: 'Model S', year: '2024', emoji: '⚡' },
];

const MATERIALS = ['Gloss', 'Matte', 'Chrome', 'Satin', 'Metallic'];
const PLACEMENTS = ['Full Wrap', '2-Door Wrap', 'Partial Wrap', 'Hood Only', 'Roof Only'];
const WRAP_COLORS = [
  '#00e5ff', '#ff6600', '#1a1a2e', '#ffffff', '#ff0055',
  '#00ff88', '#7c3aed', '#fbbf24', '#0ea5e9', '#f43f5e',
];

interface WrapResult {
  imageUrl: string;
  creativeDirections: [string, string, string];
}

export default function WrapLabPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tagline, setTagline] = useState('');
  const [selectedColor, setSelectedColor] = useState(WRAP_COLORS[0]);
  const [customColor, setCustomColor] = useState('#00e5ff');
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [placement, setPlacement] = useState(PLACEMENTS[0]);
  const [logoText, setLogoText] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<WrapResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCustomImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    setError('');
    if (!companyName.trim()) {
      setError('Please enter a company name.');
      return;
    }

    setIsGenerating(true);
    try {
      // Build enhanced prompt for this specific vehicle
      const colorDesc = `${material.toLowerCase()} ${selectedColor === customColor ? customColor : selectedColor}`;
      const designDirection = [
        `Elite ${material.toLowerCase()} vehicle wrap for a ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
        `${placement.toLowerCase()} coverage`,
        `Primary color: ${colorDesc}`,
        logoText ? `Feature branding text: "${logoText}"` : '',
        `Company: ${companyName}`,
        industry ? `Industry: ${industry}` : '',
        tagline ? `Tagline: "${tagline}"` : '',
      ].filter(Boolean).join('. ');

      const body = {
        vehicleType: selectedVehicle.id,
        vehicleYear: selectedVehicle.year,
        vehicleMake: selectedVehicle.make,
        vehicleModel: selectedVehicle.model,
        companyName: companyName || 'Think Easy Agency',
        contactEmail: 'info@thinkeasy.agency',
        industry: industry || 'Professional Services',
        preferredColors: `${material} finish, primary color ${colorDesc}, electric accents`,
        designDirection: designDirection,
        tagline: tagline || undefined,
        goals: `Generate a photorealistic, print-ready ${placement.toLowerCase()} wrap mockup for a ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. The wrap must be precisely fitted to this exact vehicle body style. Ultra-high quality, studio lighting, dramatic angle, no text artifacts, premium advertising quality.`,
      };

      const res = await fetch('/api/wrap-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success: boolean; data?: { imageUrl: string; creativeDirections: [string, string, string] }; error?: string };
      if (!data.success) {
        setError(data.error ?? 'Generation failed. Please try again.');
      } else if (data.data) {
        setResult({ imageUrl: data.data.imageUrl, creativeDirections: data.data.creativeDirections });
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  const displayImage = useCustomImage && customImagePreview ? customImagePreview : result?.imageUrl;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header */}
      <header style={{ background: 'rgba(10,10,26,0.95)', borderBottom: '1px solid #00e5ff33', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: '#00e5ff', textDecoration: 'none', fontSize: 13, opacity: 0.7 }}>← Home</Link>
          <span style={{ color: '#334155', fontSize: 18 }}>|</span>
          <span style={{ color: '#00e5ff', fontWeight: 800, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', textShadow: '0 0 20px #00e5ff88' }}>🏎 Wrap Lab</span>
          <span style={{ background: '#00e5ff22', color: '#00e5ff', fontSize: 10, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>GARAGE v2</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Select your vehicle · Customize · Generate</div>
      </header>

      {/* Main layout: sidebar | hero | right panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', minHeight: 'calc(100vh - 57px - 160px)', gap: 0 }}>

        {/* LEFT SIDEBAR */}
        <aside style={{ background: '#0d0d1f', borderRight: '1px solid #00e5ff22', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ padding: '0 16px 12px', fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Type</div>
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              onClick={() => { setSelectedVehicle(v); setResult(null); }}
              style={{
                background: selectedVehicle.id === v.id ? 'linear-gradient(90deg,#00e5ff18,transparent)' : 'transparent',
                border: 'none',
                borderLeft: selectedVehicle.id === v.id ? '3px solid #00e5ff' : '3px solid transparent',
                color: selectedVehicle.id === v.id ? '#00e5ff' : '#94a3b8',
                cursor: 'pointer',
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: selectedVehicle.id === v.id ? 700 : 400,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{v.emoji}</span>
              <span>{v.label}</span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid #00e5ff22', margin: '12px 0' }} />
          <div style={{ padding: '0 16px 12px', fontSize: 10, color: '#ff6600', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Tools</div>
          <button
            onClick={() => setResult(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px 16px', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            🔄 Reset Design
          </button>
          <button
            onClick={() => { if (result?.imageUrl) { window.open(result.imageUrl, '_blank'); } }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px 16px', textAlign: 'left', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            💾 Save Mockup
          </button>
        </aside>

        {/* CENTER HERO PREVIEW */}
        <main style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #0a0a1a 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', overflow: 'hidden' }}>
          {/* Neon grid lines background */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#00e5ff08 1px, transparent 1px), linear-gradient(90deg, #00e5ff08 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

          {/* Vehicle name */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#00e5ff', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 4 }}>Selected Vehicle</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: '#fff', textShadow: '0 0 30px #00e5ff44', letterSpacing: 1 }}>
              {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
            </h1>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{selectedVehicle.label}</div>
          </div>

          {/* Hero image area */}
          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 700, aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', border: '1px solid #00e5ff33', boxShadow: '0 0 60px #00e5ff22, inset 0 0 40px #00000088', background: '#0d1526', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {displayImage ? (
              <Image
                src={displayImage}
                alt={`${selectedVehicle.label} wrap mockup`}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 80, marginBottom: 16 }}>{selectedVehicle.emoji}</div>
                <div style={{ fontSize: 18, color: '#00e5ff', fontWeight: 700, marginBottom: 8 }}>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </div>
                <div style={{ fontSize: 14, color: '#475569' }}>
                  {isGenerating ? '⚡ Generating elite mockup...' : 'Configure your wrap and click Generate'}
                </div>
                {isGenerating && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'inline-block', width: 48, height: 48, border: '3px solid #00e5ff33', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
            )}
            {isGenerating && displayImage && (
              <div style={{ position: 'absolute', inset: 0, background: '#0a0a1a99', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: 48, height: 48, border: '3px solid #00e5ff33', borderTop: '3px solid #00e5ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ color: '#00e5ff', marginTop: 12, fontSize: 14 }}>Generating elite mockup…</div>
                </div>
              </div>
            )}
          </div>

          {/* Creative directions */}
          {result?.creativeDirections && (
            <div style={{ position: 'relative', zIndex: 2, marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 700 }}>
              {result.creativeDirections.map((dir, i) => (
                <div key={i} style={{ background: '#0d1526', border: '1px solid #00e5ff22', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>DIRECTION {i + 1}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{dir}</div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ position: 'relative', zIndex: 2, marginTop: 16, background: '#ff005522', border: '1px solid #ff0055', borderRadius: 8, padding: '10px 16px', color: '#ff6b6b', fontSize: 14, maxWidth: 700, width: '100%' }}>
              {error}
            </div>
          )}
        </main>

        {/* RIGHT CUSTOMIZATION PANEL */}
        <aside style={{ background: '#0d0d1f', borderLeft: '1px solid #00e5ff22', padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Company Info */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Company Info</div>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name *"
              style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Industry (e.g. Logistics)"
              style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline (optional)"
              style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </section>

          {/* Wrap Color */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Wrap Color</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
              {WRAP_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  title={c}
                  style={{ width: '100%', aspectRatio: '1', background: c, borderRadius: 6, border: selectedColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: selectedColor === c ? `0 0 10px ${c}` : 'none' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setSelectedColor(e.target.value); }}
                style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #1e293b', cursor: 'pointer', background: 'transparent', padding: 2 }}
              />
              <span style={{ fontSize: 12, color: '#64748b' }}>Custom color</span>
            </div>
          </section>

          {/* Material */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Material Finish</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  style={{ background: material === m ? '#00e5ff22' : '#0a0a1a', border: `1px solid ${material === m ? '#00e5ff' : '#1e293b'}`, color: material === m ? '#00e5ff' : '#64748b', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: material === m ? 700 : 400 }}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* Placement */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Wrap Placement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PLACEMENTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlacement(p)}
                  style={{ background: placement === p ? '#00e5ff22' : '#0a0a1a', border: `1px solid ${placement === p ? '#00e5ff' : '#1e293b'}`, color: placement === p ? '#00e5ff' : '#64748b', borderRadius: 6, padding: '7px 12px', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontWeight: placement === p ? 700 : 400 }}
                >
                  {placement === p ? '✓ ' : ''}{p}
                </button>
              ))}
            </div>
          </section>

          {/* Logo / Text */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Logo / Text</div>
            <input
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="Brand name or slogan for vehicle"
              style={{ width: '100%', background: '#0a0a1a', border: '1px solid #1e293b', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </section>

          {/* Image Mode */}
          <section>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Wrap Image Source</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => setUseCustomImage(false)}
                style={{ flex: 1, background: !useCustomImage ? '#00e5ff22' : '#0a0a1a', border: `1px solid ${!useCustomImage ? '#00e5ff' : '#1e293b'}`, color: !useCustomImage ? '#00e5ff' : '#64748b', borderRadius: 6, padding: '7px 8px', fontSize: 12, cursor: 'pointer', fontWeight: !useCustomImage ? 700 : 400 }}
              >
                🤖 AI Generate
              </button>
              <button
                onClick={() => setUseCustomImage(true)}
                style={{ flex: 1, background: useCustomImage ? '#ff660022' : '#0a0a1a', border: `1px solid ${useCustomImage ? '#ff6600' : '#1e293b'}`, color: useCustomImage ? '#ff6600' : '#64748b', borderRadius: 6, padding: '7px 8px', fontSize: 12, cursor: 'pointer', fontWeight: useCustomImage ? 700 : 400 }}
              >
                📁 Upload
              </button>
            </div>
            {useCustomImage && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', background: '#0a0a1a', border: '2px dashed #ff660044', borderRadius: 8, padding: '12px', color: '#ff6600', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}
                >
                  {customImageFile ? `✓ ${customImageFile.name}` : 'Click to upload wrap image'}
                </button>
              </div>
            )}
          </section>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: isGenerating ? '#1e293b' : 'linear-gradient(135deg, #ff6600, #ff4400)',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              boxShadow: isGenerating ? 'none' : '0 0 30px #ff660066',
              transition: 'all 0.2s',
            }}
          >
            {isGenerating ? '⚡ Generating...' : '🔥 Generate Mockup'}
          </button>
        </aside>
      </div>

      {/* BOTTOM VEHICLE CAROUSEL */}
      <div style={{ background: '#0d0d1f', borderTop: '1px solid #00e5ff22', padding: '16px 24px' }}>
        <div style={{ fontSize: 10, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Vehicle Garage — Select Model</div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              onClick={() => { setSelectedVehicle(v); setResult(null); }}
              style={{
                flexShrink: 0,
                background: selectedVehicle.id === v.id ? 'linear-gradient(135deg, #00e5ff22, #0a0a1a)' : '#0a0a1a',
                border: `1px solid ${selectedVehicle.id === v.id ? '#00e5ff' : '#1e293b'}`,
                borderRadius: 10,
                padding: '10px 16px',
                cursor: 'pointer',
                textAlign: 'center',
                minWidth: 100,
                transition: 'all 0.15s',
                boxShadow: selectedVehicle.id === v.id ? '0 0 20px #00e5ff33' : 'none',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{v.emoji}</div>
              <div style={{ fontSize: 11, color: selectedVehicle.id === v.id ? '#00e5ff' : '#64748b', fontWeight: selectedVehicle.id === v.id ? 700 : 400, whiteSpace: 'nowrap' }}>
                {v.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .wrap-lab-grid { grid-template-columns: 1fr !important; }
        }
        * { box-sizing: border-box; }
        input { outline: none; }
        input:focus { border-color: #00e5ff66 !important; }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
