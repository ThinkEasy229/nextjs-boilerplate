export interface VehicleOption {
  id: string;
  label: string;
  category: string;
  description: string;
  startingPrice: string;
  turnaround: string;
}

export interface PremiumPackage {
  name: string;
  priceLabel: string;
  turnaround: string;
  included: string[];
}

export interface SalesContact {
  salesEmail: string;
  salesMailto: string;
  salesPhone: string;
  salesPhoneHref: string;
}

export interface WrapDesignRequest {
  vehicleType: string;
  companyName: string;
  contactEmail: string;
  industry: string;
  preferredColors: string;
  designDirection: string;
  tagline?: string;
  goals?: string;
}

export interface WrapDesignConcept {
  id: string;
  title: string;
  headline: string;
  rationale: string;
  palette: string[];
  graphics: string[];
  layout: string;
  premiumFeature: string;
  mockupImage: string;
  mockupThumbnail: string;
}

export interface WrapDesignSessionData {
  sessionId: string;
  selectedVehicle: VehicleOption;
  concepts: WrapDesignConcept[];
  gallery: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
  }>;
  premiumPackage: PremiumPackage;
  contact: SalesContact;
}

const COLOR_KEYWORDS: Record<string, string> = {
  black: '#111827',
  white: '#f8fafc',
  blue: '#1d4ed8',
  navy: '#1e3a8a',
  red: '#dc2626',
  green: '#15803d',
  orange: '#ea580c',
  yellow: '#facc15',
  gold: '#eab308',
  silver: '#94a3b8',
  gray: '#475569',
  grey: '#475569',
  charcoal: '#334155',
  teal: '#0f766e',
  purple: '#7c3aed',
  pink: '#db2777',
};

export const VEHICLE_LIBRARY: VehicleOption[] = [
  {
    id: 'cargo-van',
    label: 'Cargo Van',
    category: 'Service Fleet',
    description: 'High-roof van mockup for installers, plumbers, HVAC crews, and delivery teams.',
    startingPrice: '$1,495+',
    turnaround: '24-hour concepts',
  },
  {
    id: 'box-truck',
    label: 'Box Truck',
    category: 'Large Format',
    description: 'Big-panel box truck layout for bold graphics, offers, and large callouts.',
    startingPrice: '$2,250+',
    turnaround: '48-hour concepts',
  },
  {
    id: 'sedan',
    label: 'Company Car',
    category: 'Executive Fleet',
    description: 'Clean car profile for sales teams, service advisors, and branded commuter vehicles.',
    startingPrice: '$1,095+',
    turnaround: '24-hour concepts',
  },
  {
    id: 'city-bus',
    label: 'Transit Bus',
    category: 'Mass Visibility',
    description: 'Long-span bus concept built for event, school, and citywide awareness campaigns.',
    startingPrice: '$3,995+',
    turnaround: '72-hour concepts',
  },
  {
    id: 'semi-truck',
    label: 'Semi Truck',
    category: 'Nationwide Branding',
    description: 'Sleeper-cab inspired tractor mockup with premium striping and trailer-ready graphics.',
    startingPrice: '$4,750+',
    turnaround: '72-hour concepts',
  },
  {
    id: 'pickup',
    label: 'Pickup Truck',
    category: 'Field Operations',
    description: 'Utility pickup wrap with door branding, bed graphics, and contractor-ready styling.',
    startingPrice: '$1,395+',
    turnaround: '24-hour concepts',
  },
];

export const PREMIUM_PACKAGE: PremiumPackage = {
  name: 'AI Premium Wrap Studio',
  priceLabel: '$249 instant concept session',
  turnaround: 'Concepts delivered in minutes, revisions in under 1 business day',
  included: [
    '3 AI-generated wrap directions tailored to your company',
    'Vehicle-specific preview mockups with branded graphics',
    'Premium purchase path plus direct sales handoff if you want revisions',
  ],
};

export function getSalesContact(configuredEmail?: string): SalesContact {
  const salesEmail = configuredEmail || 'sales@example.com';

  return {
    salesEmail,
    salesMailto: `mailto:${salesEmail}?subject=Vehicle%20Wrap%20Design%20Consultation`,
    salesPhone: '(555) 010-2026',
    salesPhoneHref: 'tel:+15550102026',
  };
}

export function getVehicleOption(vehicleType: string) {
  return VEHICLE_LIBRARY.find((vehicle) => vehicle.id === vehicleType) ?? VEHICLE_LIBRARY[0];
}

export function validateWrapDesignRequest(payload: unknown): payload is WrapDesignRequest {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as Record<string, unknown>;

  return (
    typeof record.vehicleType === 'string' &&
    record.vehicleType.trim().length > 0 &&
    typeof record.companyName === 'string' &&
    record.companyName.trim().length > 1 &&
    typeof record.contactEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contactEmail) &&
    typeof record.industry === 'string' &&
    record.industry.trim().length > 0 &&
    typeof record.preferredColors === 'string' &&
    record.preferredColors.trim().length > 0 &&
    typeof record.designDirection === 'string' &&
    record.designDirection.trim().length > 0
  );
}

export function createFallbackConcepts(
  request: WrapDesignRequest,
  configuredSalesEmail?: string
): WrapDesignSessionData {
  const selectedVehicle = getVehicleOption(request.vehicleType);
  const contact = getSalesContact(configuredSalesEmail);
  const basePalette = resolvePalette(request.preferredColors);
  const companyName = request.companyName.trim();
  const focus = request.tagline?.trim() || request.designDirection.trim();
  const concepts = [
    buildConcept({
      request,
      selectedVehicle,
      id: 'velocity',
      title: `${companyName} Velocity`,
      headline: `Fast-read fleet branding for ${request.industry}`,
      rationale: `Pairs high-contrast diagonal motion graphics with ${focus.toLowerCase()} so the ${selectedVehicle.label.toLowerCase()} reads clearly at speed and in parking-lot photos.`,
      palette: basePalette,
      graphics: ['Angular speed ribbons', 'Rear-door call to action', 'Oversized phone and URL lockup'],
      layout: 'Driver-side logo plate, passenger-side service stack, rear conversion panel',
      premiumFeature: 'Built for instant quoting, QR callouts, and after-hours service visibility',
    }),
    buildConcept({
      request,
      selectedVehicle,
      id: 'signature',
      title: `${companyName} Signature`,
      headline: `Premium brand-forward wrap with refined whitespace`,
      rationale: `Balances elegant open space with ${request.preferredColors.toLowerCase()} accents so your company feels established, premium, and easy to recognize on every stop.`,
      palette: rotatePalette(basePalette, 1),
      graphics: ['Wrapped rocker stripe', 'Panel-by-panel testimonial zone', 'Metallic inspired highlight blocks'],
      layout: 'Door logo anchor, long-form side statement, clean rear approval proof',
      premiumFeature: 'Designed to justify premium pricing with showroom-style presentation',
    }),
    buildConcept({
      request,
      selectedVehicle,
      id: 'impact',
      title: `${companyName} Impact`,
      headline: `Campaign-style concept for launches, promos, and dominant curb appeal`,
      rationale: `Uses layered illustration bands and bolder color blocking to emphasize ${request.designDirection.toLowerCase()} while keeping the contact path obvious if the customer wants a human consult.`,
      palette: rotatePalette(basePalette, 2),
      graphics: ['Hero benefit badge', 'Large-format service icons', 'Contact-sales footer strip'],
      layout: 'Bold center-stage headline, lower-third services rail, rear door sales CTA',
      premiumFeature: 'Optimized for gallery comparison and premium upsell presentations',
    }),
  ];

  return {
    sessionId: '',
    selectedVehicle,
    concepts,
    gallery: concepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      description: concept.headline,
      image: concept.mockupThumbnail,
    })),
    premiumPackage: PREMIUM_PACKAGE,
    contact,
  };
}

export function createVehicleMockup(
  vehicleType: string,
  palette: string[],
  companyName: string,
  headline: string,
  compact = false
) {
  const vehicle = getVehicleOption(vehicleType);
  const width = compact ? 360 : 760;
  const height = compact ? 180 : 320;
  const viewBox = '0 0 760 320';
  const [primary, secondary, accent] = palette;
  const safeCompany = escapeXml(companyName.toUpperCase().slice(0, 24));
  const safeHeadline = escapeXml(headline.slice(0, 44));
  const bodyMarkup = getVehicleMarkup(vehicle.id, primary, secondary, accent);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none" role="img" aria-label="${escapeXml(vehicle.label)} wrap mockup">
      <defs>
        <linearGradient id="road" x1="0" y1="260" x2="760" y2="260" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0f172a" stop-opacity="0" />
          <stop offset="0.5" stop-color="#0f172a" stop-opacity="0.12" />
          <stop offset="1" stop-color="#0f172a" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="wrapGradient" x1="120" y1="60" x2="600" y2="240" gradientUnits="userSpaceOnUse">
          <stop stop-color="${primary}" />
          <stop offset="0.55" stop-color="${secondary}" />
          <stop offset="1" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="760" height="320" rx="28" fill="#f8fafc" />
      <rect x="32" y="248" width="696" height="18" rx="9" fill="url(#road)" />
      ${bodyMarkup}
      <rect x="214" y="118" width="206" height="54" rx="16" fill="rgba(255,255,255,0.88)" />
      <text x="230" y="148" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">${safeCompany}</text>
      <text x="230" y="188" fill="#334155" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="500">${safeHeadline}</text>
      <circle cx="170" cy="246" r="28" fill="#111827" />
      <circle cx="170" cy="246" r="14" fill="#cbd5e1" />
      <circle cx="584" cy="246" r="28" fill="#111827" />
      <circle cx="584" cy="246" r="14" fill="#cbd5e1" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildConcept({
  request,
  selectedVehicle,
  id,
  title,
  headline,
  rationale,
  palette,
  graphics,
  layout,
  premiumFeature,
}: {
  request: WrapDesignRequest;
  selectedVehicle: VehicleOption;
  id: string;
  title: string;
  headline: string;
  rationale: string;
  palette: string[];
  graphics: string[];
  layout: string;
  premiumFeature: string;
}) {
  return {
    id,
    title,
    headline,
    rationale,
    palette,
    graphics,
    layout,
    premiumFeature,
    mockupImage: createVehicleMockup(selectedVehicle.id, palette, request.companyName, headline),
    mockupThumbnail: createVehicleMockup(selectedVehicle.id, palette, request.companyName, title, true),
  };
}

function resolvePalette(preferredColors: string) {
  const lowered = preferredColors.toLowerCase();
  const matches = Object.entries(COLOR_KEYWORDS)
    .filter(([keyword]) => lowered.includes(keyword))
    .map(([, value]) => value);

  const unique = Array.from(new Set(matches));

  if (unique.length >= 3) {
    return unique.slice(0, 3);
  }

  if (unique.length === 2) {
    return [unique[0], unique[1], '#f97316'];
  }

  if (unique.length === 1) {
    return [unique[0], '#0f172a', '#f8fafc'];
  }

  return ['#0f172a', '#2563eb', '#f97316'];
}

function rotatePalette(palette: string[], shift: number) {
  return palette.map((_, index) => palette[(index + shift) % palette.length]);
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function getVehicleMarkup(vehicleType: string, primary: string, secondary: string, accent: string) {
  const stroke = '#cbd5e1';

  switch (vehicleType) {
    case 'box-truck':
      return `
        <rect x="126" y="76" width="434" height="122" rx="16" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <path d="M560 104H628C648 104 664 120 664 140V198H560V104Z" fill="#e5e7eb" stroke="${stroke}" stroke-width="2" />
        <path d="M152 100H542V194H152Z" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M176 90L380 90L336 194L132 194Z" fill="${accent}" opacity="0.18" />
        <path d="M590 120H642V154H590Z" fill="#cbd5e1" />
      `;
    case 'sedan':
      return `
        <path d="M134 182C156 130 228 102 340 102H474C540 102 588 124 628 170V218H134V182Z" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <path d="M176 150H614V216H176Z" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M274 112H438C472 112 516 132 546 164H228C240 140 252 124 274 112Z" fill="#cbd5e1" />
        <path d="M182 160L346 160L302 216L138 216Z" fill="${accent}" opacity="0.22" />
      `;
    case 'city-bus':
      return `
        <rect x="88" y="88" width="550" height="126" rx="20" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <rect x="114" y="110" width="500" height="92" rx="14" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M128 118H594" stroke="#ffffff" stroke-opacity="0.42" stroke-width="2" stroke-dasharray="8 8" />
        <path d="M208 110H260V152H208Z M274 110H326V152H274Z M340 110H392V152H340Z M406 110H458V152H406Z M472 110H524V152H472Z" fill="#dbeafe" />
        <path d="M114 174H614" stroke="${accent}" stroke-width="10" stroke-linecap="round" />
      `;
    case 'semi-truck':
      return `
        <rect x="152" y="124" width="318" height="84" rx="18" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M470 102H566C606 102 638 134 638 174V208H470V102Z" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <rect x="152" y="112" width="318" height="100" rx="20" fill="none" stroke="${stroke}" stroke-width="2" />
        <path d="M188 132H430" stroke="#ffffff" stroke-opacity="0.55" stroke-width="4" />
        <path d="M502 118H596V160H502Z" fill="#cbd5e1" />
        <path d="M174 126L300 126L252 208L126 208Z" fill="${accent}" opacity="0.22" />
      `;
    case 'pickup':
      return `
        <path d="M140 182C166 138 228 118 314 118H458L540 142C572 152 602 176 618 206H140V182Z" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <path d="M176 146H558V206H176Z" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M290 122H434C452 122 474 136 500 162H248C258 144 272 130 290 122Z" fill="#cbd5e1" />
        <path d="M432 146H550V202H432Z" fill="${secondary}" opacity="0.76" />
        <path d="M182 156L354 156L304 206L132 206Z" fill="${accent}" opacity="0.22" />
      `;
    default:
      return `
        <path d="M124 94H470C504 94 534 112 548 140L566 176H650V214H124V94Z" fill="#e2e8f0" stroke="${stroke}" stroke-width="2" />
        <path d="M150 114H512L546 176H150V114Z" fill="url(#wrapGradient)" opacity="0.94" />
        <path d="M478 108H532L548 152H478Z" fill="#cbd5e1" />
        <path d="M154 130L344 130L288 214L98 214Z" fill="${accent}" opacity="0.22" />
      `;
  }
}
