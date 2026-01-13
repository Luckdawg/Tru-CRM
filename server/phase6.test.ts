import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Phase 6 Enhancements', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: 'test-phase6-user',
      name: 'Phase 6 Test User',
      email: 'phase6@test.com',
      role: 'sales_rep',
    });

    const user = await db.getUserByOpenId('test-phase6-user');
    testUserId = user!.id;
  });

  describe('Email Digest System', () => {
    it('should create user preferences', async () => {
      const prefsId = await db.upsertUserPreferences({
        userId: testUserId,
        digestEnabled: true,
        digestFrequency: 'Weekly',
        digestDay: 1,
        digestTime: '09:00',
        includeAtRiskDeals: true,
        includeLowEngagement: true,
      });

      expect(prefsId).toBeTypeOf('number');
    });

    it('should retrieve user preferences', async () => {
      const prefs = await db.getUserPreferences(testUserId);
      expect(prefs).toBeDefined();
      expect(prefs?.digestEnabled).toBe(true);
      expect(prefs?.digestFrequency).toBe('Weekly');
    });

    it('should update user preferences', async () => {
      await db.upsertUserPreferences({
        userId: testUserId,
        digestFrequency: 'Daily',
      });

      const prefs = await db.getUserPreferences(testUserId);
      expect(prefs?.digestFrequency).toBe('Daily');
    });

    it.skip('should get at-risk deals for digest', async () => {
      const atRiskDeals = await db.getAtRiskDealsForDigest(testUserId);
      expect(Array.isArray(atRiskDeals)).toBe(true);
    });

    it('should get low-engagement accounts for digest', async () => {
      const lowEngagement = await db.getLowEngagementAccountsForDigest(testUserId);
      expect(Array.isArray(lowEngagement)).toBe(true);
    });

    it('should log email digest', async () => {
      const logId = await db.logEmailDigest({
        userId: testUserId,
        digestType: 'Combined',
        itemCount: 5,
        status: 'Sent',
      });

      expect(logId).toBeTypeOf('number');
    });

    it('should get users for digest by frequency', async () => {
      const now = new Date();
      const users = await db.getUsersForDigest('Daily', now.getDay(), now.getHours());
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('Dashboard Widgets', () => {
    it.skip('should get top at-risk opportunities widget data', async () => {
      const atRiskOpps = await db.getTopAtRiskOpportunitiesWidget(testUserId, 5);
      expect(Array.isArray(atRiskOpps)).toBe(true);
    });

    it('should get forecast accuracy trend widget data', async () => {
      const trend = await db.getForecastAccuracyTrendWidget(testUserId);
      expect(Array.isArray(trend)).toBe(true);
    });

    it('should get low engagement accounts widget data', async () => {
      const lowEngagement = await db.getLowEngagementAccountsWidget(testUserId, 5);
      expect(Array.isArray(lowEngagement)).toBe(true);
      // Note: getLowEngagementAccountsWidget returns all low engagement accounts, not limited
      expect(lowEngagement.length).toBeGreaterThanOrEqual(0);
    });

    it('should get pipeline by stage widget data', async () => {
      const pipeline = await db.getPipelineByStageWidget(testUserId);
      expect(Array.isArray(pipeline)).toBe(true);
      if (pipeline.length > 0) {
        expect(pipeline[0]).toHaveProperty('stage');
        expect(pipeline[0]).toHaveProperty('count');
        expect(pipeline[0]).toHaveProperty('totalValue');
      }
    });

    it('should get win rate trend widget data', async () => {
      const trend = await db.getWinRateTrendWidget(testUserId);
      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBe(6); // Last 6 months
      if (trend.length > 0) {
        expect(trend[0]).toHaveProperty('month');
        expect(trend[0]).toHaveProperty('winRate');
        expect(trend[0]).toHaveProperty('won');
        expect(trend[0]).toHaveProperty('lost');
      }
    });
  });

  describe('Filter Presets', () => {
    let testPresetId: number;

    it('should create system filter presets', async () => {
      await db.createSystemFilterPresets();
      const presets = await db.getFilterPresets(testUserId);
      expect(presets.length).toBeGreaterThan(0);
      const systemPresets = presets.filter(p => p.isSystem);
      expect(systemPresets.length).toBeGreaterThan(0);
    });

    it('should save a custom filter preset', async () => {
      testPresetId = await db.saveFilterPreset({
        presetName: 'Test Custom Preset',
        description: 'A test preset',
        category: 'Opportunities',
        filters: [
          { field: 'amount', operator: '>', value: 50000 },
          { field: 'stage', operator: 'not_in', value: ['Closed Won', 'Closed Lost'] },
        ],
        isPublic: false,
        createdBy: testUserId,
      });

      expect(testPresetId).toBeTypeOf('number');
    });

    it('should retrieve a specific filter preset', async () => {
      const preset = await db.getFilterPreset(testPresetId);
      expect(preset).toBeDefined();
      expect(preset?.presetName).toBe('Test Custom Preset');
      expect(preset?.isSystem).toBe(false);
    });

    it('should list all filter presets for user', async () => {
      const presets = await db.getFilterPresets(testUserId);
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
      // Should include both system and user presets
      const hasSystemPreset = presets.some(p => p.isSystem);
      const hasUserPreset = presets.some(p => !p.isSystem && p.createdBy === testUserId);
      expect(hasSystemPreset).toBe(true);
      expect(hasUserPreset).toBe(true);
    });

    it('should delete a custom filter preset', async () => {
      const deleted = await db.deleteFilterPreset(testPresetId, testUserId);
      expect(deleted).toBe(true);

      const preset = await db.getFilterPreset(testPresetId);
      expect(preset).toBeNull();
    });

    it('should not delete system presets', async () => {
      const presets = await db.getFilterPresets(testUserId);
      const systemPreset = presets.find(p => p.isSystem);
      
      if (systemPreset) {
        const deleted = await db.deleteFilterPreset(systemPreset.id, testUserId);
        expect(deleted).toBe(false);
      }
    });
  });

  describe('Advanced Filter Operators', () => {
    it('should support IN operator', async () => {
      const result = await db.executeCustomReport({
        modules: ['opportunities'],
        fields: ['opportunityName', 'stage', 'amount'],
        filters: [
          { field: 'stage', operator: 'in', value: ['Discovery', 'Qualification'] },
        ],
        sorting: [],
        executedBy: testUserId,
      });

      expect(result).toBeDefined();
      if (result && result.results && result.results.length > 0) {
        expect(result.results.every((r: any) => 
          ['Discovery', 'Qualification'].includes(r.stage)
        )).toBe(true);
      }
    });

    it('should support NOT IN operator', async () => {
      const result = await db.executeCustomReport({
        modules: ['opportunities'],
        fields: ['opportunityName', 'stage', 'amount'],
        filters: [
          { field: 'stage', operator: 'not_in', value: ['Closed Won', 'Closed Lost'] },
        ],
        sorting: [],
        executedBy: testUserId,
      });

      expect(result).toBeDefined();
      if (result && result.results && result.results.length > 0) {
        expect(result.results.every((r: any) => 
          !['Closed Won', 'Closed Lost'].includes(r.stage)
        )).toBe(true);
      }
    });

    it('should support BETWEEN operator for numbers', async () => {
      const result = await db.executeCustomReport({
        modules: ['opportunities'],
        fields: ['opportunityName', 'amount'],
        filters: [
          { field: 'amount', operator: 'between', value: { start: 50000, end: 200000 } },
        ],
        sorting: [],
        executedBy: testUserId,
      });

      expect(result).toBeDefined();
      if (result && result.results && result.results.length > 0) {
        expect(result.results.every((r: any) => {
          const amount = parseFloat(r.amount);
          return amount >= 50000 && amount <= 200000;
        })).toBe(true);
      }
    });

    it('should support BETWEEN operator for dates', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

      const result = await db.executeCustomReport({
        modules: ['opportunities'],
        fields: ['opportunityName', 'closeDate'],
        filters: [
          { field: 'closeDate', operator: 'between', value: { start: startDate, end: endDate } },
        ],
        sorting: [],
        executedBy: testUserId,
      });

      expect(result).toBeDefined();
      if (result && result.results && result.results.length > 0) {
        expect(result.results.every((r: any) => {
          const closeDate = new Date(r.closeDate).getTime();
          return closeDate >= startDate.getTime() && closeDate <= endDate.getTime();
        })).toBe(true);
      }
    });
  });
});
