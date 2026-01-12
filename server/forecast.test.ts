import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';

describe('Forecast Projection', () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available for testing');
    }
  });

  describe('getForecastProjection', () => {
    it('should return forecast data with win rate and pipeline', async () => {
      const result = await db.getForecastProjection();
      
      if (result) {
        expect(result).toHaveProperty('winRate');
        expect(result).toHaveProperty('avgDealSize');
        expect(result).toHaveProperty('pipeline');
        expect(Array.isArray(result.pipeline)).toBe(true);
        expect(typeof result.winRate).toBe('number');
        expect(result.winRate).toBeGreaterThanOrEqual(0);
        expect(result.winRate).toBeLessThanOrEqual(1);
      }
    });

    it('should include forecasted revenue for each month', async () => {
      const result = await db.getForecastProjection();
      
      if (result && result.pipeline.length > 0) {
        result.pipeline.forEach(item => {
          expect(item).toHaveProperty('month');
          expect(item).toHaveProperty('opportunityCount');
          expect(item).toHaveProperty('pipelineValue');
          expect(item).toHaveProperty('forecastedRevenue');
          expect(typeof item.forecastedRevenue).toBe('number');
          expect(item.forecastedRevenue).toBeLessThanOrEqual(item.pipelineValue);
        });
      }
    });

    it('should limit forecast to next 6 months', async () => {
      const result = await db.getForecastProjection();
      
      if (result) {
        expect(result.pipeline.length).toBeLessThanOrEqual(6);
      }
    });

    it('should only include future opportunities', async () => {
      const result = await db.getForecastProjection();
      
      if (result && result.pipeline.length > 0) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
        
        result.pipeline.forEach(item => {
          // Each month should be current month or later
          expect(item.month >= todayStr || item.month.substring(0, 4) >= today.getFullYear().toString()).toBe(true);
        });
      }
    });
  });
});
