import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CollectorView } from './CollectorView';
import * as api from '../services/api';
import type { TriageAnalysisResponse } from '../services/api';

vi.mock('../services/api', () => ({
  analyzeTriage: vi.fn(), submitClarification: vi.fn(), fetchPricingCatalog: vi.fn(),
  calculateMeasuredValuation: vi.fn(), createWasteLot: vi.fn(), generateHandoverQR: vi.fn(),
}));

const result = (overrides: Partial<TriageAnalysisResponse> = {}): TriageAnalysisResponse => ({
  analysis_source: 'demo', item_title: 'Demo metal', category: 'recyclable',
  overall_confidence: 0.9, confidence_tier: 'HIGH', materials_detected: [],
  contamination_risk: 'Unknown', recycling_potential: 'Provisional', biodegradability_rating: 'No',
  recommended_pathway: 'Inspection', requires_manual_inspection: false,
  hazard_analysis: { is_hazardous: false, battery_damage: false, chemical_leak: false,
    exposed_wiring: false, pressurized_canister: false, sharp_edges: false },
  safe_handling_guidance: 'Inspection first',
  segregation_guidance: { compatible_materials: [], incompatible_materials: [],
    segregation_reasoning: 'Provisional', safe_storage_instructions: 'Review first' },
  ...overrides,
});

beforeEach(() => {
  vi.mocked(api.fetchPricingCatalog).mockResolvedValue([]);
  vi.mocked(api.analyzeTriage).mockResolvedValue(result());
});
afterEach(cleanup);

async function ready() {
  render(<CollectorView />);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Run demo sample' }) as HTMLButtonElement).disabled).toBe(false));
}

function upload() {
  fireEvent.change(screen.getByLabelText('Upload scrap photo'), {
    target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] },
  });
}

describe('collector triage', () => {
  it('reruns uploaded content instead of the selected demo', async () => {
    await ready();
    vi.mocked(api.analyzeTriage).mockResolvedValue(result({ analysis_source: 'bedrock', model_id: 'nova-test', item_title: 'Uploaded metal' }));
    upload();
    await screen.findByText(/Uploaded photo analyzed with nova-test/);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze uploaded photo' }));
    await waitFor(() => expect(api.analyzeTriage).toHaveBeenCalledTimes(3));
    const calls = vi.mocked(api.analyzeTriage).mock.calls;
    expect(calls[1][0]).toBeUndefined();
    expect(calls[1][1]).toMatch(/^data:image\/png;base64,/);
    expect(calls[2]).toEqual(calls[1]);
    expect(api.calculateMeasuredValuation).not.toHaveBeenCalled();
  });

  it('clears previous results and shows the server failure', async () => {
    await ready();
    vi.mocked(api.analyzeTriage).mockRejectedValue(new Error('Image analysis is unavailable.'));
    upload();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Image analysis is unavailable.');
    expect(screen.queryByText('Demo metal')).toBeNull();
    expect(screen.queryByRole('button', { name: /Generate Signed Handover/ })).toBeNull();
  });

  it('prevents handover and valuation for review-required results', async () => {
    await ready();
    vi.mocked(api.analyzeTriage).mockResolvedValue(result({ analysis_source: 'bedrock', requires_manual_inspection: true }));
    upload();
    await screen.findByText(/Inspection required. Valuation and handover are paused/);
    const qr = screen.getByRole('button', { name: /Generate Signed Handover/ }) as HTMLButtonElement;
    expect(qr.disabled).toBe(true);
    fireEvent.click(qr);
    expect(api.createWasteLot).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: /Recalculate with Scale Weight/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('invalidates a result when a collector reports a hazard', async () => {
    await ready();
    fireEvent.click(screen.getByLabelText('Chemical leak'));
    expect(screen.queryByRole('button', { name: /Generate Signed Handover/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Run demo sample' }));
    await waitFor(() => expect(api.analyzeTriage).toHaveBeenLastCalledWith('electric_motor', undefined, { chemical_leak: true }));
  });

  it('rejects oversized uploads without calling the API', async () => {
    await ready();
    fireEvent.change(screen.getByLabelText('Upload scrap photo'), {
      target: { files: [new File([new Uint8Array(3_750_001)], 'large.png', { type: 'image/png' })] },
    });
    expect(screen.getByRole('alert').textContent).toContain('3.75 MB');
    expect(api.analyzeTriage).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Demo metal')).toBeNull();
  });
});
