import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drafts,saveDraft,syncDraft,ApiError } from './workflow';
const draft={id:'draft-1',owner:'collector_demo',payload:{title:'Offline cable',material_id:'copper',weight_kg:10},image:'test-image',created_at:'2026-10-11'};
beforeEach(()=>{vi.restoreAllMocks();vi.stubGlobal("localStorage",{getItem:()=>null});});
describe('durable offline queue',()=>{
 it('isolates owners and keeps a draft after an ambiguous network failure',async()=>{
  await saveDraft(draft);expect(await drafts('other')).toEqual([]);
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('Network interrupted')));
  await expect(syncDraft(draft)).rejects.toThrow('Network interrupted');
  expect((await drafts(draft.owner))[0].id).toBe(draft.id);
 });
 it('uses stable operation IDs for retries and deletes only after acknowledgement',async()=>{
  await saveDraft(draft);
  const fetcher=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({id:'evidence-1'}),{headers:{'Content-Type':'application/json'}})).mockResolvedValueOnce(new Response(JSON.stringify({id:'lot-1'}),{headers:{'Content-Type':'application/json'}}));
  vi.stubGlobal('fetch',fetcher);await syncDraft(draft);
  expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe('draft-1:evidence');
  expect(fetcher.mock.calls[1][1].headers['Idempotency-Key']).toBe('draft-1');
  expect(JSON.parse(fetcher.mock.calls[1][1].body).evidence_id).toBe('evidence-1');
  expect(await drafts(draft.owner)).toEqual([]);
 });
 it('retains rejected submissions for correction',async()=>{
  await saveDraft(draft);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({detail:'Invalid image'}),{status:422,headers:{'Content-Type':'application/json'}})));
  await expect(syncDraft(draft)).rejects.toBeInstanceOf(ApiError);expect(await drafts(draft.owner)).toHaveLength(1);
 });
});
