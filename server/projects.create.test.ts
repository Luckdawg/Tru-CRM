import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { getDb } from './db';

describe('Projects Creation', () => {
  let testAccountId: number;

  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      throw new Error('Database not available for testing');
    }

    // Create a test account for project creation
    const testAccount = await db.createAccount({
      accountName: 'Test Account for Projects',
      region: 'North America',
      industry: 'Manufacturing',
      ownerId: 1,
    });
    testAccountId = testAccount.id;
  });

  describe('createProject', () => {
    it('should create a new project with required fields', async () => {
      const projectData = {
        projectName: 'Test Implementation Project',
        accountId: testAccountId,
        ownerId: 1,
      };

      const project = await db.createProject(projectData);

      expect(project).toBeDefined();
      expect(project.id).toBeGreaterThan(0);
      expect(project.projectName).toBe(projectData.projectName);
      expect(project.accountId).toBe(testAccountId);
      expect(project.status).toBe('Planning'); // Default status
    });

    it('should create a project with optional fields', async () => {
      const projectData = {
        projectName: 'Advanced Implementation',
        accountId: testAccountId,
        status: 'In Progress' as const,
        goLiveDate: new Date('2026-06-01'),
        healthStatus: 'Healthy' as const,
        adoptionLevel: 'High' as const,
        activeUsers: 150,
        customerSentiment: 'Positive' as const,
        notes: 'Customer is very engaged',
        ownerId: 1,
      };

      const project = await db.createProject(projectData);

      expect(project).toBeDefined();
      expect(project.projectName).toBe(projectData.projectName);
      expect(project.status).toBe('In Progress');
      expect(project.healthStatus).toBe('Healthy');
      expect(project.adoptionLevel).toBe('High');
      expect(project.activeUsers).toBe(150);
      expect(project.customerSentiment).toBe('Positive');
    });
  });

  describe('getAllProjects', () => {
    it('should retrieve all projects', async () => {
      const projects = await db.getAllProjects();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
    });

    it('should filter projects by owner', async () => {
      const projects = await db.getAllProjects(1);
      expect(Array.isArray(projects)).toBe(true);
      projects.forEach(project => {
        expect(project.ownerId).toBe(1);
      });
    });
  });

  describe('getProjectById', () => {
    it('should retrieve a specific project by id', async () => {
      const allProjects = await db.getAllProjects();
      if (allProjects.length === 0) {
        throw new Error('No projects available for testing');
      }

      const testProject = allProjects[0];
      const project = await db.getProjectById(testProject.id);

      expect(project).toBeDefined();
      expect(project?.id).toBe(testProject.id);
      expect(project?.projectName).toBe(testProject.projectName);
    });

    it('should return null for non-existent project', async () => {
      const project = await db.getProjectById(999999);
      expect(project).toBeNull();
    });
  });
});
