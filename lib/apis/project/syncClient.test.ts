import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncGeneratedData } from './syncClient';
import * as projectClient from './client';
import * as inventoryClient from '../inventory/client';
import * as storageClient from '../storage/client';
import * as reportClient from './reportClient';
import { GeneratedSpecs, GeneratedFlow, GeneratedBOM } from '../generate/types';
import { ProjectTagEnum } from './types';

// Mock dependencies
vi.mock('./client');
vi.mock('../inventory/client');
vi.mock('../storage/client');
vi.mock('./reportClient');

describe('syncGeneratedData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call all necessary API endpoints in order', async () => {
    // Setup mocks
    const mockProject = { id: 'test-proj', name: 'Test', time: 'now', tag: ProjectTagEnum.IOT };
    vi.mocked(projectClient.createProject).mockResolvedValue(mockProject);
    vi.mocked(storageClient.uploadToStorage).mockResolvedValue({ url: 'http://test.pdf' } as any);
    vi.mocked(reportClient.createReport).mockResolvedValue({} as any);
    vi.mocked(inventoryClient.createItem).mockResolvedValue({ id: 'item-1' } as any);
    vi.mocked(projectClient.createProjectComponent).mockResolvedValue({ id: 'comp-1' } as any);
    vi.mocked(projectClient.createProjectNode).mockResolvedValue({} as any);
    vi.mocked(projectClient.createProjectEdge).mockResolvedValue({} as any);
    vi.mocked(projectClient.createProjectSubstitute).mockResolvedValue({} as any);

    const specs: GeneratedSpecs = { specs: [] } as any;
    const bom: GeneratedBOM = {
      tag: 'IoT',
      items: [{ id: 'i1', name: 'Comp1' }],
      substitutes: [
        { originalComponentId: 'comp-0-test-proj', substituteComponentId: 'item-sub-0-test' },
      ],
    } as any;
    const flow: GeneratedFlow = { 
        nodes: [{ id: 'Comp1', positionX: 0, positionY: 0 }], 
        edges: [{ sourceId: 'Comp1', targetId: 'Comp1', label: '', type: '' }] 
    } as any;
    const pdf = new ArrayBuffer(0);

    // Act
    await syncGeneratedData('TestProj', specs, bom, flow, pdf);

    // Assert
    expect(projectClient.createProject).toHaveBeenCalled();
    expect(storageClient.uploadToStorage).toHaveBeenCalledTimes(1);
    expect(reportClient.createReport).toHaveBeenCalled();
    expect(inventoryClient.createItemsBatch).toHaveBeenCalled();
    expect(projectClient.createProjectComponentsBatch).toHaveBeenCalled();
    expect(projectClient.createProjectNodesBatch).toHaveBeenCalled();
    expect(projectClient.createProjectEdgesBatch).toHaveBeenCalled();
    expect(projectClient.createProjectSubstitute).toHaveBeenCalledWith(
      expect.objectContaining({
        originalComponentId: 'comp-0-test-proj',
        substituteComponentId: 'item-sub-0-test',
      }),
    );
  });
});
