# ScrapSetu — Frontend Operations Console

The frontend is an enterprise-grade circular resource intelligence dashboard built with **React 19**, **TypeScript**, and **Tailwind CSS v4**, designed for seamless responsiveness across mobile, tablet, and high-density industrial control displays.

---

## Architecture & Workspaces

The application is structured into 5 core operational modules sharing a unified design system:

```
frontend/
├── index.html                   # HTML entrypoint with Plus Jakarta Sans & JetBrains Mono Google Fonts
├── package.json                 # Project dependencies (React 19, Leaflet, Lucide, Tailwind v4)
├── vite.config.ts               # Vite bundler configuration with @tailwindcss/vite
├── src/
│   ├── main.tsx                 # Root React DOM mounter
│   ├── App.tsx                  # Main console layout, theme state, and telemetry status strip
│   ├── index.css                # Base design tokens, CSS variables, dark/light surfaces, button utilities
│   ├── services/
│   │   └── api.ts               # Complete typed API client with resilient offline mock fallbacks
│   └── components/
│       ├── Header.tsx           # Command bar with tactile tab switcher, spot price ticker, and theme toggle
│       ├── CollectorView.tsx    # Module 01: Scrap Intake Triage, scale measurement, Mandi valuation & QR
│       ├── VendorPortalView.tsx # Module 02: Aggregator inventory bays, weighbridge inspection & bulk batches
│       ├── RecyclerPortalView.tsx # Module 03: PostGIS recycler matrix, intake scan & EPR certificate issuance
│       ├── TraceabilityView.tsx # Module 04: Chain-of-custody genealogy graph, TXN ledger & UPI payment settlement
│       ├── MunicipalDashboardView.tsx # Module 05: Geospatial bin network, 80% fill alerts & CVRP dispatch
│       └── InteractiveMap.tsx   # Leaflet map component with custom marker beacons and polyline routes
```

---

## 5 Operational Portals

1. **01. Kabadiwala & Collector Workbench (`CollectorView.tsx`)**:
   - Multimodal AI waste triage powered by AWS Bedrock.
   - Deterministic safety overrides for hazardous materials (swollen batteries, chemicals).
   - Strict calibrated physical scale weight recording ($W_{\text{actual}}$).
   - Live Mandi commodity index benchmark rates with instant formula-based valuation.
   - HMAC-SHA256 signed digital handover QR token generation.

2. **02. Vendor Portal & Warehouse Ledger (`VendorPortalView.tsx`)**:
   - Real-time incoming lots queue.
   - Dual-party weighbridge receiving with automatic discrepancy delta calculation.
   - Contamination deduction logging and purchase offer issuance.
   - Warehouse storage bay management (`Bay A-1`, `Bay B-2`, `Bay C-1`, `Bay E-1`) enforcing CPCB co-storage isolation.
   - Aggregation into bulk commercial batches for certified recycling mills.

3. **03. Recycler Portal & Recovery Ledger (`RecyclerPortalView.tsx`)**:
   - PostGIS spatial matching of accredited facilities within the Delhi-NCR network.
   - Dual-party weighbridge intake confirmation with cryptographic timestamp hash.
   - Circularity recovery yield computation.
   - Generation of non-repudiable CPCB Form-2 Extended Producer Responsibility (EPR) audit certificates.

4. **04. Traceability & Audit Ledger (`TraceabilityView.tsx`)**:
   - Visual step-by-step custody timeline graph from Collector &rarr; Vendor &rarr; Recycler.
   - Searchable transactions ledger with separate transfer status (`CONFIRMED`, `DISPUTED`) and payment status (`PENDING`, `PAID`).
   - Integrated UPI payment settlement modal.

5. **05. Municipal Fleet & Smart Bin Dispatch (`MunicipalDashboardView.tsx`)**:
   - Live Leaflet map displaying municipal aggregation bins.
   - Telemetry simulation triggers for load cells and ultrasonic fill sensors.
   - Automatic 80% capacity breach detection.
   - CVRP route solver generating minimum-distance collection itineraries for EV canters.

---

## Design System & Theme Tokens

- **Typography**: 
  - Sans & Headings: `Plus Jakarta Sans` (`--font-sans`, `--font-heading`) — crisp, modern, authoritative typography avoiding generic AI cliches.
  - Monospace: `JetBrains Mono` (`--font-mono`) — for tabular kilograms, rupee rates, coordinates, and SHA-256 hashes.
- **Surface Variables**:
  - `--bg-canvas`: `#f8fafc` (Light) / `#090e17` (Dark executive obsidian slate)
  - `--bg-surface`: `#ffffff` (Light) / `#0e1726` (Dark slate navy)
  - `--bg-surface-subtle`: `#f1f5f9` (Light) / `#142034` (Dark)
  - `--bg-surface-well`: `#e2e8f0` (Light) / `#0a111e` (Dark)
  - `--border-subtle`: Subtle translucent borders providing crisp contrast in both modes.
- **Semantic Accents**:
  - Emerald (`#059669` / `#10b981`): Operational, compliant, verified, solved.
  - Rose (`#e11d48` / `#f43f5e`): Capacity breaches ($\ge 80\%$), hazardous containment alerts, disputed transfers.
  - Amber (`#d97706` / `#f59e0b`): Medium confidence clarifications, pending inspections, active vehicles.
  - Cyan (`#0284c7` / `#06b6d4`): Spatial matrices, coordinates, and physical scale weights.

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:5173)
npm run dev

# Run Oxlint static code analysis
npm run lint

# TypeScript compilation check & production build
npm run build

# Preview production build locally
npm run preview
```
