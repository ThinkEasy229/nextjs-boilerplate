'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Vehicle class definitions ────────────────────────────────────────────────
type VehicleClass = 'regular' | 'luxury';

const VEHICLE_CLASS_CONFIG: Record<VehicleClass, {
  label: string;
  emoji: string;
  tagline: string;
  accentColor: string;
  vehicle: { id: string; label: string; make: string; model: string; year: string; emoji: string };
  pricing: { basePrice: number; perSqFt: number; driverPayMultiplier: number };
}> = {
  regular: {
    label: 'Regular Vehicle',
    emoji: '🚐',
    tagline: 'Cargo Vans · Box Trucks · Fleet Vehicles',
    accentColor: '#00e5ff',
    vehicle: { id: 'cargo-van', label: 'Cargo Van', make: 'Ford', model: 'Transit', year: '2024', emoji: '🚐' },
    pricing: { basePrice: 1200, perSqFt: 8, driverPayMultiplier: 1.0 },
  },
  luxury: {
    label: 'Luxury Vehicle',
    emoji: '🏎️',
    tagline: 'Exotic Sports Cars · Premium Sedans',
    accentColor: '#f59e0b',
    vehicle: { id: 'ferrari', label: 'Ferrari', make: 'Ferrari', model: '488 GTB', year: '2024', emoji: '🏎️' },
    pricing: { basePrice: 3500, perSqFt: 22, driverPayMultiplier: 1.75 },
  },
};

const PLACEMENT_SQ_FT: Record<string, number> = {
  'Full Wrap': 200,
  '2-Door Wrap': 80,
  'Partial Wrap': 100,
  'Hood Only': 25,
  'Roof Only': 30,
};

function calcPrice(vehicleClass: VehicleClass, placement: string): number {
  const cfg = VEHICLE_CLASS_CONFIG[vehicleClass].pricing;
  const sqFt = PLACEMENT_SQ_FT[placement] ?? 100;
  return cfg.basePrice + sqFt * cfg.perSqFt;
}

// ─── Static options ───────────────────────────────────────────────────────────
const MATERIALS = ['Gloss', 'Matte', 'Chrome', 'Satin', 'Metallic'];
const PLACEMENTS = ['Full Wrap', '2-Door Wrap', 'Partial Wrap', 'Hood Only', 'Roof Only'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface WrapResult {
  imageUrl: string;
  creativeDirections: [string, string, string];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WrapLabPage() {
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('regular');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tagline, setTagline] = useState('');
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [placement, setPlacement] = useState(PLACEMENTS[0]);
  const [logoText, setLogoText] = useState('');
  const [imageSource, setImageSource] = useState<'ai' | 'upload'>('ai');
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<WrapResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classCfg = VEHICLE_CLASS_CONFIG[vehicleClass];
  const selectedVehicle = classCfg.vehicle;
  const accent = classCfg.accentColor;
  const estimatedPrice = calcPrice(vehicleClass, placement);

  function handleClassChange(cls: VehicleClass) {
    setVehicleClass(cls);
    setResult(null);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are supported');
      return;
    }
    setCustomImageFile(file);
    setError('');
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
    if (imageSource === 'upload' && !customImageFile) {
      setError('Please upload an image for your wrap design.');
      return;
    }
    setIsGenerating(true);
    try {
      const designDirection = [
        `Elite ${material.toLowerCase()} vehicle wrap for a ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
        `${placement.toLowerCase()} coverage`,
        `Material finish: ${material}`,
        logoText ? `Feature branding text: "${logoText}"` : '',
        `Company: ${companyName}`,
        industry ? `Industry: ${industry}` : '',
        tagline ? `Tagline: "${tagline}"` : '',
        `Vehicle class: ${classCfg.label}`,
      ].filter(Boolean).join('. ');

      const body = {
        vehicleType: selectedVehicle.id,
        vehicleYear: selectedVehicle.year,
        vehicleMake: selectedVehicle.make,
        vehicleModel: selectedVehicle.model,
        companyName: companyName || 'Think Easy Agency',
        contactEmail: 'info@thinkeasy.agency',
        industry: industry || 'Professional Services',
        preferredColors: `${material} finish, electric accents`,
        designDirection,
        tagline: tagline || undefined,
        goals: `Generate a photorealistic, print-ready ${placement.toLowerCase()} wrap mockup for a ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}. The wrap must be precise, vehicle-accurate, ultra-high quality, studio lighting, dramatic angle, no text artifacts, premium advertising quality.`,
        vehicleClass,
        estimatedPrice,
        driverPayMultiplier: classCfg.pricing.driverPayMultiplier,
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

  const displayImage = imageSource === 'upload' && customImagePreview ? customImagePreview : result?.imageUrl;

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: 'rgba(8,8,16,0.97)', borderBottom: `1px solid ${accent}33`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: accent, textDecoration: 'none', fontSize: 12, opacity: 0.65, letterSpacing: 1 }}>← HOME</Link>
          <span style={{ color: '#1e293b', fontSize: 20 }}>|</span>
          <span style={{ color: accent, fontWeight: 900, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', textShadow: `0 0 24px ${accent}88` }}>🏎 Wrap Lab</span>
          <span style={{ background: `${accent}22`, color: accent, fontSize: 9, padding: '2px 8px', borderRadius: 4, letterSpacing: 2, fontWeight: 700 }}>PRO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase' }}>Est. Price</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: accent, letterSpacing: 1 }}>${estimatedPrice.toLocaleString()}</div>
          </div>
        </div>
      </header>

      {/* ── Vehicle Class Mode ── */}
      <div style={{ background: '#0b0b18', borderBottom: '1px solid #ffffff0a', padding: '20px 28px' }}>
        <div style={{ fontSize: 10, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>Select Vehicle Class</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {(Object.entries(VEHICLE_CLASS_CONFIG) as [VehicleClass, typeof VEHICLE_CLASS_CONFIG[VehicleClass]][]).map(([cls, cfg]) => {
            const isActive = vehicleClass === cls;
            return (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                style={{
                  flex: '1 1 200px',
                  maxWidth: 280,
                  background: isActive ? `linear-gradient(135deg, ${cfg.accentColor}18, ${cfg.accentColor}08)` : '#0d0d1f',
                  border: `2px solid ${isActive ? cfg.accentColor : '#1e293b'}`,
                  borderRadius: 14,
                  padding: '18px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 30px ${cfg.accentColor}33` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{cfg.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isActive ? cfg.accentColor : '#94a3b8', letterSpacing: 0.5 }}>{cfg.label}</span>
                  {isActive && <span style={{ marginLeft: 'auto', background: cfg.accentColor, color: '#000', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>{cfg.tagline}</div>
                <div style={{ marginTop: 10, fontSize: 13, color: isActive ? cfg.accentColor : '#64748b', fontWeight: 700 }}>
                  From ${cfg.pricing.basePrice.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main layout: hero | right panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 'calc(100vh - 200px)', gap: 0 }}>

        {/* ── CENTER HERO PREVIEW ── */}
        <main style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #080810 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 28px', position: 'relative', overflow: 'hidden' }}>
          {/* Grid background */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}08 1px, transparent 1px), linear-gradient(90deg, ${accent}08 1px, transparent 1px)`, backgroundSize: '60px 60px', pointerEvents: 'none' }} />
          {/* Glow orb */}
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: `radial-gradient(ellipse, ${accent}0a 0%, transparent 70%)`, pointerEvents: 'none' }} />

          {/* Vehicle badge */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${accent}11`, border: `1px solid ${accent}33`, borderRadius: 30, padding: '6px 18px', marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>{selectedVehicle.emoji}</span>
              <span style={{ fontSize: 11, color: accent, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>{classCfg.label}</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: '#f1f5f9', textShadow: `0 0 40px ${accent}44`, letterSpacing: 1, lineHeight: 1.1 }}>
              {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
            </h1>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 6, letterSpacing: 1 }}>{placement} · {material} Finish</div>
          </div>

          {/* Hero image */}
          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 760, aspectRatio: '16/9', borderRadius: 20, overflow: 'hidden', border: `1px solid ${accent}33`, boxShadow: `0 0 80px ${accent}33, 0 24px 60px #00000088`, marginBottom: 24 }}>
            {displayImage ? (
              <Image
                src={displayImage}
                alt={`${selectedVehicle.label} wrap mockup`}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0d1526 0%, #080810 100%)', padding: 32 }}>
                <div style={{ fontSize: 96, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.3))' }}>{selectedVehicle.emoji}</div>
                <div style={{ fontSize: 20, color: accent, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </div>
                <div style={{ fontSize: 14, color: '#475569' }}>
                  {isGenerating ? '⚡ Generating elite mockup…' : 'Configure your build and click Generate →'}
                </div>
                {isGenerating && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'inline-block', width: 52, height: 52, border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
            )}
            {isGenerating && displayImage && (
              <div style={{ position: 'absolute', inset: 0, background: '#08081099', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: 52, height: 52, border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ color: accent, marginTop: 14, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>Rendering mockup…</div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing summary */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#0d1526', border: `1px solid ${accent}22`, borderRadius: 12, padding: '12px 20px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Wrap Type</div>
              <div style={{ fontSize: 14, color: accent, fontWeight: 700 }}>{classCfg.label}</div>
            </div>
            <div style={{ background: '#0d1526', border: `1px solid ${accent}22`, borderRadius: 12, padding: '12px 20px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Placement</div>
              <div style={{ fontSize: 14, color: accent, fontWeight: 700 }}>{placement}</div>
            </div>
            <div style={{ background: '#0d1526', border: `1px solid ${accent}22`, borderRadius: 12, padding: '12px 20px', textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 10, color: '#475569', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Est. Total</div>
              <div style={{ fontSize: 18, color: accent, fontWeight: 900 }}>${estimatedPrice.toLocaleString()}</div>
            </div>
          </div>

          {/* Creative directions */}
          {result?.creativeDirections && (
            <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 760 }}>
              {result.creativeDirections.map((dir, i) => (
                <div key={i} style={{ background: '#0d1526', border: `1px solid ${accent}22`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9, color: accent, letterSpacing: 2, marginBottom: 6, fontWeight: 800, textTransform: 'uppercase' }}>Direction {i + 1}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{dir}</div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ position: 'relative', zIndex: 2, marginTop: 16, background: '#ff005518', border: '1px solid #ff005566', borderRadius: 10, padding: '12px 18px', color: '#ff6b6b', fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
        </main>

        {/* ── RIGHT BUILD PANEL ── */}
        <aside style={{ background: '#0b0b18', borderLeft: '1px solid #ffffff0a', padding: '24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Tools */}
          <section>
            <div style={{ fontSize: 9, color: '#ff6600', letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Tools</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setResult(null)}
                style={{ flex: 1, background: '#0d0d1f', border: '1px solid #1e293b', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              >
                🔄 Reset
              </button>
              <button
                onClick={() => { if (result?.imageUrl) { window.open(result.imageUrl, '_blank'); } }}
                style={{ flex: 1, background: '#0d0d1f', border: '1px solid #1e293b', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              >
                💾 Save
              </button>
            </div>
          </section>

          {/* Company Info */}
          <section>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Company Info</div>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name *"
              style={{ width: '100%', background: '#080810', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Industry (e.g. Logistics)"
              style={{ width: '100%', background: '#080810', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
            />
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline (optional)"
              style={{ width: '100%', background: '#080810', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </section>

          {/* Material Finish */}
          <section>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Material Finish</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  style={{ background: material === m ? `${accent}22` : '#0d0d1f', border: `1px solid ${material === m ? accent : '#1e293b'}`, color: material === m ? accent : '#64748b', borderRadius: 8, padding: '7px 13px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s', fontWeight: material === m ? 700 : 400 }}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          {/* Wrap Placement */}
          <section>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Wrap Placement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PLACEMENTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlacement(p)}
                  style={{ background: placement === p ? `${accent}18` : '#0d0d1f', border: `1px solid ${placement === p ? accent : '#1e293b'}`, color: placement === p ? accent : '#64748b', borderRadius: 8, padding: '9px 14px', fontSize: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontWeight: placement === p ? 700 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{placement === p ? '✓ ' : ''}{p}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{PLACEMENT_SQ_FT[p]} ft²</span>
                </button>
              ))}
            </div>
          </section>

          {/* Logo / Text */}
          <section>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Logo / Text</div>
            <input
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="Brand name or slogan for vehicle"
              style={{ width: '100%', background: '#080810', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }}
            />
          </section>

          {/* Image Source */}
          <section>
            <div style={{ fontSize: 9, color: accent, letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Image Source</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '11px 12px', borderRadius: 10, background: imageSource === 'ai' ? `${accent}0f` : 'transparent', border: `1px solid ${imageSource === 'ai' ? `${accent}44` : '#1e293b'}`, transition: 'all 0.15s' }}>
                <input type="radio" name="imageSource" value="ai" checked={imageSource === 'ai'} onChange={() => setImageSource('ai')} style={{ marginTop: 2, cursor: 'pointer', width: 15, height: 15 }} />
                <div>
                  <div style={{ fontSize: 13, color: imageSource === 'ai' ? accent : '#e2e8f0', fontWeight: 700 }}>🤖 AI Generate</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Create mockup from design specs</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '11px 12px', borderRadius: 10, background: imageSource === 'upload' ? '#ff660011' : 'transparent', border: `1px solid ${imageSource === 'upload' ? '#ff660033' : '#1e293b'}`, transition: 'all 0.15s' }}>
                <input type="radio" name="imageSource" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} style={{ marginTop: 2, cursor: 'pointer', width: 15, height: 15 }} />
                <div>
                  <div style={{ fontSize: 13, color: imageSource === 'upload' ? '#ff6600' : '#e2e8f0', fontWeight: 700 }}>📁 Upload Image</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Use your own wrap design</div>
                </div>
              </label>
            </div>
            {imageSource === 'upload' && (
              <div style={{ marginTop: 10 }}>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', background: '#080810', border: '2px dashed #ff660044', borderRadius: 10, padding: '12px', color: '#ff6600', fontSize: 13, cursor: 'pointer', textAlign: 'center', fontWeight: 600, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff6600'; e.currentTarget.style.background = '#ff660011'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ff660044'; e.currentTarget.style.background = '#080810'; }}
                >
                  {customImageFile ? `✓ ${customImageFile.name}` : '↑ Click to upload image'}
                </button>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 6, textAlign: 'center' }}>JPG, PNG, or WebP · max 10 MB</div>
              </div>
            )}
          </section>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{ background: isGenerating ? '#1e293b' : `linear-gradient(135deg, #ff6600, #ff3300)`, border: 'none', borderRadius: 12, padding: '16px', color: '#fff', fontSize: 15, fontWeight: 900, cursor: isGenerating ? 'not-allowed' : 'pointer', letterSpacing: 1, textTransform: 'uppercase', boxShadow: isGenerating ? 'none' : '0 0 40px #ff660055', transition: 'all 0.2s' }}
          >
            {isGenerating ? '⚡ Generating…' : '🔥 Generate Mockup'}
          </button>
        </aside>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input { outline: none; }
        input:focus { border-color: #00e5ff66 !important; }
        button:hover:not(:disabled) { opacity: 0.88; }
        @media (max-width: 860px) {
          .wrap-lab-main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
