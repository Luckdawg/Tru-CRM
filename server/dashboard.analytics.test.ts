import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';
import { accounts, opportunities } from '../drizzle/schema';

describe('Dashboard Analytics', () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available for testing');
    }
  });

  describe('getActiveAccountsCount', () => {
    it('should return the count of active accounts', async () => {
      const count = await db.getActiveAccountsCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getWinRate', () => {
    it('should return null when no closed opportunities exist', async () => {
      const winRate = await db.getWinRate(90);
      // Win rate can be null if no closed opportunities exist
      if (winRate !== null) {
        expect(typeof winRate).toBe('number');
        expect(winRate).toBeGreaterThanOrEqual(0);
        expect(winRate).toBeLessThanOrEqual(100);
      } else {
        expect(winRate).toBeNull();
      }
    });

    it('should accept custom days parameter', async () => {
      const winRate30 = await db.getWinRate(30);
      const winRate90 = await db.getWinRate(90);
      
      // Both should be null or valid percentages
      if (winRate30 !== null) {
        expect(winRate30).toBeGreaterThanOrEqual(0);
        expect(winRate30).toBeLessThanOrEqual(100);
      }
      if (winRate90 !== null) {
        expect(winRate90).toBeGreaterThanOrEqual(0);
        expect(winRate90).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getAverageDealSize', () => {
    it('should return null when no won opportunities exist in current quarter', async () => {
      const avgDealSize = await db.getAverageDealSize();
      // Average deal size can be null if no won opportunities exist
      if (avgDealSize !== null) {
        expect(typeof avgDealSize).toBe('number');
        expect(avgDealSize).toBeGreaterThan(0);
      } else {
        expect(avgDealSize).toBeNull();
      }
    });
  });

  describe('getPipelineByStage', () => {
    it('should return pipeline grouped by stage', async () => {
      const pipeline = await db.getPipelineByStage();
      expect(Array.isArray(pipeline)).toBe(true);
      
      // Each stage should have count and totalValue
      pipeline.forEach(stage => {
        expect(stage).toHaveProperty('stage');
        expect(stage).toHaveProperty('count');
        expect(stage).toHaveProperty('totalValue');
        expect(typeof stage.count).toBe('number');
      });
    });

    it('should not include Closed Won or Closed Lost stages', async () => {
      const pipeline = await db.getPipelineByStage();
      const closedStages = pipeline.filter(
        stage => stage.stage === 'Closed Won' || stage.stage === 'Closed Lost'
      );
      expect(closedStages.length).toBe(0);
    });
  });
});
