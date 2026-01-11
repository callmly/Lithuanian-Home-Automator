import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  plans,
  optionGroups,
  options,
  planOptions,
  featureGroups,
  features,
  planFeatures,
  siteContent,
  leads,
  contentBlocks,
  menuLinks,
  type Plan,
  type InsertPlan,
  type OptionGroup,
  type InsertOptionGroup,
  type Option,
  type InsertOption,
  type PlanOption,
  type InsertPlanOption,
  type FeatureGroup,
  type InsertFeatureGroup,
  type Feature,
  type InsertFeature,
  type PlanFeature,
  type InsertPlanFeature,
  type SiteContent,
  type InsertSiteContent,
  type Lead,
  type InsertLead,
  type ContentBlock,
  type InsertContentBlock,
  type MenuLink,
  type InsertMenuLink,
} from "@shared/schema";

export interface IStorage {
  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<void>;

  // Option Groups
  getOptionGroups(): Promise<OptionGroup[]>;
  createOptionGroup(group: InsertOptionGroup): Promise<OptionGroup>;
  updateOptionGroup(id: number, group: Partial<InsertOptionGroup>): Promise<OptionGroup | undefined>;
  deleteOptionGroup(id: number): Promise<void>;

  // Options
  getOptions(): Promise<Option[]>;
  getOption(id: number): Promise<Option | undefined>;
  createOption(option: InsertOption): Promise<Option>;
  updateOption(id: number, option: Partial<InsertOption>): Promise<Option | undefined>;
  deleteOption(id: number): Promise<void>;

  // Plan Options
  getPlanOptions(): Promise<PlanOption[]>;
  createPlanOption(planOption: InsertPlanOption): Promise<PlanOption>;
  deletePlanOption(id: number): Promise<void>;

  // Feature Groups
  getFeatureGroups(): Promise<FeatureGroup[]>;
  createFeatureGroup(group: InsertFeatureGroup): Promise<FeatureGroup>;
  updateFeatureGroup(id: number, group: Partial<InsertFeatureGroup>): Promise<FeatureGroup | undefined>;
  deleteFeatureGroup(id: number): Promise<void>;

  // Features
  getFeatures(): Promise<Feature[]>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature | undefined>;
  deleteFeature(id: number): Promise<void>;

  // Plan Features
  getPlanFeatures(): Promise<PlanFeature[]>;
  upsertPlanFeature(pf: InsertPlanFeature): Promise<PlanFeature>;
  deletePlanFeature(featureId: number, planId: number): Promise<void>;

  // Site Content
  getSiteContent(): Promise<SiteContent[]>;
  getSiteContentByKey(key: string): Promise<SiteContent | undefined>;
  upsertSiteContent(content: InsertSiteContent): Promise<SiteContent>;

  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;

  // Content Blocks
  getContentBlocks(): Promise<ContentBlock[]>;
  getActiveContentBlocks(): Promise<ContentBlock[]>;
  getContentBlock(id: number): Promise<ContentBlock | undefined>;
  createContentBlock(block: InsertContentBlock): Promise<ContentBlock>;
  updateContentBlock(id: number, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined>;
  deleteContentBlock(id: number): Promise<void>;

  // Menu Links
  getMenuLinks(): Promise<MenuLink[]>;
  getActiveMenuLinks(): Promise<MenuLink[]>;
  getMenuLink(id: number): Promise<MenuLink | undefined>;
  createMenuLink(link: InsertMenuLink): Promise<MenuLink>;
  updateMenuLink(id: number, link: Partial<InsertMenuLink>): Promise<MenuLink | undefined>;
  deleteMenuLink(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Plans
  async getPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder);
  }

  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: number, plan: Partial<InsertPlan>): Promise<Plan | undefined> {
    const [updated] = await db.update(plans).set(plan).where(eq(plans.id, id)).returning();
    return updated;
  }

  async deletePlan(id: number): Promise<void> {
    await db.delete(plans).where(eq(plans.id, id));
  }

  // Option Groups
  async getOptionGroups(): Promise<OptionGroup[]> {
    return db.select().from(optionGroups).orderBy(optionGroups.sortOrder);
  }

  async createOptionGroup(group: InsertOptionGroup): Promise<OptionGroup> {
    const [newGroup] = await db.insert(optionGroups).values(group).returning();
    return newGroup;
  }

  async updateOptionGroup(id: number, group: Partial<InsertOptionGroup>): Promise<OptionGroup | undefined> {
    const [updated] = await db.update(optionGroups).set(group).where(eq(optionGroups.id, id)).returning();
    return updated;
  }

  async deleteOptionGroup(id: number): Promise<void> {
    await db.delete(optionGroups).where(eq(optionGroups.id, id));
  }

  // Options
  async getOptions(): Promise<Option[]> {
    return db.select().from(options).orderBy(options.sortOrder);
  }

  async getOption(id: number): Promise<Option | undefined> {
    const [option] = await db.select().from(options).where(eq(options.id, id));
    return option;
  }

  async createOption(option: InsertOption): Promise<Option> {
    const [newOption] = await db.insert(options).values(option).returning();
    return newOption;
  }

  async updateOption(id: number, option: Partial<InsertOption>): Promise<Option | undefined> {
    const [updated] = await db.update(options).set(option).where(eq(options.id, id)).returning();
    return updated;
  }

  async deleteOption(id: number): Promise<void> {
    await db.delete(options).where(eq(options.id, id));
  }

  // Plan Options
  async getPlanOptions(): Promise<PlanOption[]> {
    return db.select().from(planOptions);
  }

  async createPlanOption(planOption: InsertPlanOption): Promise<PlanOption> {
    const [newPlanOption] = await db.insert(planOptions).values(planOption).returning();
    return newPlanOption;
  }

  async deletePlanOption(id: number): Promise<void> {
    await db.delete(planOptions).where(eq(planOptions.id, id));
  }

  // Feature Groups
  async getFeatureGroups(): Promise<FeatureGroup[]> {
    return db.select().from(featureGroups).orderBy(featureGroups.sortOrder);
  }

  async createFeatureGroup(group: InsertFeatureGroup): Promise<FeatureGroup> {
    const [newGroup] = await db.insert(featureGroups).values(group).returning();
    return newGroup;
  }

  async updateFeatureGroup(id: number, group: Partial<InsertFeatureGroup>): Promise<FeatureGroup | undefined> {
    const [updated] = await db.update(featureGroups).set(group).where(eq(featureGroups.id, id)).returning();
    return updated;
  }

  async deleteFeatureGroup(id: number): Promise<void> {
    await db.delete(featureGroups).where(eq(featureGroups.id, id));
  }

  // Features
  async getFeatures(): Promise<Feature[]> {
    return db.select().from(features).orderBy(features.sortOrder);
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    const [newFeature] = await db.insert(features).values(feature).returning();
    return newFeature;
  }

  async updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature | undefined> {
    const [updated] = await db.update(features).set(feature).where(eq(features.id, id)).returning();
    return updated;
  }

  async deleteFeature(id: number): Promise<void> {
    await db.delete(features).where(eq(features.id, id));
  }

  // Plan Features
  async getPlanFeatures(): Promise<PlanFeature[]> {
    return db.select().from(planFeatures);
  }

  async upsertPlanFeature(pf: InsertPlanFeature): Promise<PlanFeature> {
    const existing = await db
      .select()
      .from(planFeatures)
      .where(and(eq(planFeatures.featureId, pf.featureId), eq(planFeatures.planId, pf.planId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(planFeatures)
        .set(pf)
        .where(and(eq(planFeatures.featureId, pf.featureId), eq(planFeatures.planId, pf.planId)))
        .returning();
      return updated;
    }

    const [newPf] = await db.insert(planFeatures).values(pf).returning();
    return newPf;
  }

  async deletePlanFeature(featureId: number, planId: number): Promise<void> {
    await db
      .delete(planFeatures)
      .where(and(eq(planFeatures.featureId, featureId), eq(planFeatures.planId, planId)));
  }

  // Site Content
  async getSiteContent(): Promise<SiteContent[]> {
    return db.select().from(siteContent);
  }

  async getSiteContentByKey(key: string): Promise<SiteContent | undefined> {
    const [content] = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return content;
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    const existing = await this.getSiteContentByKey(content.key);

    if (existing) {
      const [updated] = await db
        .update(siteContent)
        .set({ ...content, updatedAt: new Date() })
        .where(eq(siteContent.key, content.key))
        .returning();
      return updated;
    }

    const [newContent] = await db.insert(siteContent).values(content).returning();
    return newContent;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  // Content Blocks
  async getContentBlocks(): Promise<ContentBlock[]> {
    return db.select().from(contentBlocks).orderBy(contentBlocks.sortOrder);
  }

  async getActiveContentBlocks(): Promise<ContentBlock[]> {
    return db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.isActive, true))
      .orderBy(contentBlocks.sortOrder);
  }

  async getContentBlock(id: number): Promise<ContentBlock | undefined> {
    const [block] = await db.select().from(contentBlocks).where(eq(contentBlocks.id, id));
    return block;
  }

  async createContentBlock(block: InsertContentBlock): Promise<ContentBlock> {
    const [newBlock] = await db.insert(contentBlocks).values(block).returning();
    return newBlock;
  }

  async updateContentBlock(id: number, block: Partial<InsertContentBlock>): Promise<ContentBlock | undefined> {
    const [updated] = await db
      .update(contentBlocks)
      .set({ ...block, updatedAt: new Date() })
      .where(eq(contentBlocks.id, id))
      .returning();
    return updated;
  }

  async deleteContentBlock(id: number): Promise<void> {
    await db.delete(contentBlocks).where(eq(contentBlocks.id, id));
  }

  // Menu Links
  async getMenuLinks(): Promise<MenuLink[]> {
    return db.select().from(menuLinks).orderBy(menuLinks.sortOrder);
  }

  async getActiveMenuLinks(): Promise<MenuLink[]> {
    return db
      .select()
      .from(menuLinks)
      .where(eq(menuLinks.isActive, true))
      .orderBy(menuLinks.sortOrder);
  }

  async getMenuLink(id: number): Promise<MenuLink | undefined> {
    const [link] = await db.select().from(menuLinks).where(eq(menuLinks.id, id));
    return link;
  }

  async createMenuLink(link: InsertMenuLink): Promise<MenuLink> {
    const [newLink] = await db.insert(menuLinks).values(link).returning();
    return newLink;
  }

  async updateMenuLink(id: number, link: Partial<InsertMenuLink>): Promise<MenuLink | undefined> {
    const [updated] = await db
      .update(menuLinks)
      .set(link)
      .where(eq(menuLinks.id, id))
      .returning();
    return updated;
  }

  async deleteMenuLink(id: number): Promise<void> {
    await db.delete(menuLinks).where(eq(menuLinks.id, id));
  }
}

export const storage = new DatabaseStorage();
