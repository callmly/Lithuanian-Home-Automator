import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// ============ PLANS ============
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  nameLt: varchar("name_lt", { length: 100 }).notNull(),
  taglineLt: text("tagline_lt"),
  descriptionLt: text("description_lt"),
  basePriceCents: integer("base_price_cents").notNull().default(0),
  isHighlighted: boolean("is_highlighted").default(false),
  sortOrder: integer("sort_order").default(0),
});

export const plansRelations = relations(plans, ({ many }) => ({
  planOptions: many(planOptions),
  planFeatures: many(planFeatures),
}));

export const insertPlanSchema = createInsertSchema(plans).omit({ id: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plans.$inferSelect;

// ============ OPTIONS (quantity, switch type, add-ons) ============
export const optionGroups = pgTable("option_groups", {
  id: serial("id").primaryKey(),
  typeLt: varchar("type_lt", { length: 50 }).notNull(), // "quantity" | "switch" | "addon"
  titleLt: varchar("title_lt", { length: 100 }).notNull(),
  descriptionLt: text("description_lt"),
  sortOrder: integer("sort_order").default(0),
});

export const optionGroupsRelations = relations(optionGroups, ({ many }) => ({
  options: many(options),
}));

export const insertOptionGroupSchema = createInsertSchema(optionGroups).omit({ id: true });
export type InsertOptionGroup = z.infer<typeof insertOptionGroupSchema>;
export type OptionGroup = typeof optionGroups.$inferSelect;

export const options = pgTable("options", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => optionGroups.id, { onDelete: "cascade" }),
  labelLt: varchar("label_lt", { length: 150 }).notNull(),
  descriptionLt: text("description_lt"),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  minQty: integer("min_qty").default(1),
  maxQty: integer("max_qty").default(100),
  defaultQty: integer("default_qty").default(1),
  isDefault: boolean("is_default").default(false),
  sortOrder: integer("sort_order").default(0),
  tooltipEnabled: boolean("tooltip_enabled").default(false),
  tooltipText: text("tooltip_text"),
  tooltipLink: text("tooltip_link"),
  tooltipImage: text("tooltip_image"),
});

export const optionsRelations = relations(options, ({ one, many }) => ({
  group: one(optionGroups, {
    fields: [options.groupId],
    references: [optionGroups.id],
  }),
  planOptions: many(planOptions),
}));

export const insertOptionSchema = createInsertSchema(options).omit({ id: true });
export type InsertOption = z.infer<typeof insertOptionSchema>;
export type Option = typeof options.$inferSelect;

// Plan-specific option availability/pricing
export const planOptions = pgTable("plan_options", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  optionId: integer("option_id").notNull().references(() => options.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").default(true),
  priceDeltaCents: integer("price_delta_cents").default(0),
});

export const planOptionsRelations = relations(planOptions, ({ one }) => ({
  plan: one(plans, {
    fields: [planOptions.planId],
    references: [plans.id],
  }),
  option: one(options, {
    fields: [planOptions.optionId],
    references: [options.id],
  }),
}));

export const insertPlanOptionSchema = createInsertSchema(planOptions).omit({ id: true });
export type InsertPlanOption = z.infer<typeof insertPlanOptionSchema>;
export type PlanOption = typeof planOptions.$inferSelect;

// Plan-specific option group visibility (which option groups to show per plan)
export const planOptionGroups = pgTable("plan_option_groups", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  optionGroupId: integer("option_group_id").notNull().references(() => optionGroups.id, { onDelete: "cascade" }),
});

export const planOptionGroupsRelations = relations(planOptionGroups, ({ one }) => ({
  plan: one(plans, {
    fields: [planOptionGroups.planId],
    references: [plans.id],
  }),
  optionGroup: one(optionGroups, {
    fields: [planOptionGroups.optionGroupId],
    references: [optionGroups.id],
  }),
}));

export const insertPlanOptionGroupSchema = createInsertSchema(planOptionGroups).omit({ id: true });
export type InsertPlanOptionGroup = z.infer<typeof insertPlanOptionGroupSchema>;
export type PlanOptionGroup = typeof planOptionGroups.$inferSelect;

// ============ FEATURE COMPARISON ============
export const featureGroups = pgTable("feature_groups", {
  id: serial("id").primaryKey(),
  titleLt: varchar("title_lt", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  tooltipEnabled: boolean("tooltip_enabled").default(false),
  tooltipText: text("tooltip_text"),
  tooltipLink: text("tooltip_link"),
  tooltipImage: text("tooltip_image"),
});

export const featureGroupsRelations = relations(featureGroups, ({ many }) => ({
  features: many(features),
}));

export const insertFeatureGroupSchema = createInsertSchema(featureGroups).omit({ id: true });
export type InsertFeatureGroup = z.infer<typeof insertFeatureGroupSchema>;
export type FeatureGroup = typeof featureGroups.$inferSelect;

export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => featureGroups.id, { onDelete: "cascade" }),
  labelLt: varchar("label_lt", { length: 150 }).notNull(),
  valueType: varchar("value_type", { length: 20 }).notNull().default("boolean"), // "boolean" | "text"
  sortOrder: integer("sort_order").default(0),
  tooltipEnabled: boolean("tooltip_enabled").default(false),
  tooltipText: text("tooltip_text"),
  tooltipLink: text("tooltip_link"),
  tooltipImage: text("tooltip_image"),
});

export const featuresRelations = relations(features, ({ one, many }) => ({
  group: one(featureGroups, {
    fields: [features.groupId],
    references: [featureGroups.id],
  }),
  planFeatures: many(planFeatures),
}));

export const insertFeatureSchema = createInsertSchema(features).omit({ id: true });
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;

export const planFeatures = pgTable("plan_features", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").notNull().references(() => features.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  valueBoolean: boolean("value_boolean"),
  valueText: text("value_text"),
});

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  feature: one(features, {
    fields: [planFeatures.featureId],
    references: [features.id],
  }),
  plan: one(plans, {
    fields: [planFeatures.planId],
    references: [plans.id],
  }),
}));

export const insertPlanFeatureSchema = createInsertSchema(planFeatures).omit({ id: true });
export type InsertPlanFeature = z.infer<typeof insertPlanFeatureSchema>;
export type PlanFeature = typeof planFeatures.$inferSelect;

// ============ SITE CONTENT ============
export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  headingLt: text("heading_lt"),
  bodyLt: text("body_lt"),
  ctaLabelLt: varchar("cta_label_lt", { length: 100 }),
  mediaUrl: text("media_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteContentSchema = createInsertSchema(siteContent).omit({ id: true, updatedAt: true });
export type InsertSiteContent = z.infer<typeof insertSiteContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;

// ============ LEADS ============
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => plans.id),
  planName: varchar("plan_name", { length: 100 }),
  totalPriceCents: integer("total_price_cents").notNull().default(0),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  city: varchar("city", { length: 100 }),
  comment: text("comment"),
  selectedOptions: jsonb("selected_options").$type<SelectedOptionData[]>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("leads_created_at_idx").on(table.createdAt),
]);

export type SelectedOptionData = {
  optionId: number;
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// ============ CONTENT BLOCKS ============
export const contentBlocks = pgTable("content_blocks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }),
  titleLt: varchar("title_lt", { length: 150 }),
  contentLt: text("content_lt"),
  isHtml: boolean("is_html").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContentBlockSchema = createInsertSchema(contentBlocks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;
export type ContentBlock = typeof contentBlocks.$inferSelect;

// ============ MENU LINKS ============
export const menuLinks = pgTable("menu_links", {
  id: serial("id").primaryKey(),
  labelLt: varchar("label_lt", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull().default("section"),
  targetValue: varchar("target_value", { length: 200 }).notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

export const insertMenuLinkSchema = createInsertSchema(menuLinks).omit({ id: true });
export type InsertMenuLink = z.infer<typeof insertMenuLinkSchema>;
export type MenuLink = typeof menuLinks.$inferSelect;

// ============ LEAD FORM VALIDATION ============
export const leadFormSchema = z.object({
  planId: z.number(),
  name: z.string().min(2, "Vardas per trumpas"),
  email: z.string().email("Neteisingas el. pašto formatas"),
  phone: z.string().optional(),
  city: z.string().min(2, "Įveskite miestą arba objektą"),
  comment: z.string().optional(),
  selectedOptions: z.array(z.object({
    optionId: z.number(),
    quantity: z.number().min(1),
  })),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// ============ SEO SETTINGS ============
export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  ogTitle: varchar("og_title", { length: 200 }),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
  googleAnalyticsScript: text("google_analytics_script"),
  customHeadCode: text("custom_head_code"),
  robotsTxt: text("robots_txt"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSeoSettingsSchema = createInsertSchema(seoSettings).omit({ id: true, updatedAt: true });
export type InsertSeoSettings = z.infer<typeof insertSeoSettingsSchema>;
export type SeoSettings = typeof seoSettings.$inferSelect;
