import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';

describe('Reports Functions', () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available for testing');
    }
  });

  describe('getOpportunitiesByCloseDate', () => {
    it('should return opportunities grouped by close date month', async () => {
      const result = await db.getOpportunitiesByCloseDate();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(item => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('totalValue');
        expect(typeof item.count).toBe('number');
      });
    });
  });

  describe('getRevenueByMonth', () => {
    it('should return revenue grouped by month for closed won deals', async () => {
      const result = await db.getRevenueByMonth();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(item => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('revenue');
        expect(item).toHaveProperty('count');
        expect(typeof item.revenue).toBe('number');
        expect(typeof item.count).toBe('number');
      });
    });
  });

  describe('getOpportunitiesByType', () => {
    it('should return opportunities grouped by type', async () => {
      const result = await db.getOpportunitiesByType();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('totalValue');
        expect(typeof item.count).toBe('number');
      });
    });
  });

  describe('getLeadsBySource', () => {
    it('should return leads grouped by source', async () => {
      const result = await db.getLeadsBySource();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(item => {
        expect(item).toHaveProperty('source');
        expect(item).toHaveProperty('count');
        expect(typeof item.count).toBe('number');
      });
    });
  });

  describe('getPipelineByStage', () => {
    it('should not include Closed Won or Closed Lost stages', async () => {
      const result = await db.getPipelineByStage();
      const closedStages = result.filter(
        item => item.stage === 'Closed Won' || item.stage === 'Closed Lost'
      );
      expect(closedStages.length).toBe(0);
    });

    it('should return stage, count, and totalValue for each stage', async () => {
      const result = await db.getPipelineByStage();
      expect(Array.isArray(result)).toBe(true);
      
      result.forEach(item => {
        expect(item).toHaveProperty('stage');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('totalValue');
        expect(typeof item.count).toBe('number');
      });
    });
  });
});
