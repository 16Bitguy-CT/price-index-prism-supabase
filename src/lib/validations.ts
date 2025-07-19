
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
});

// Organization schemas
export const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  brand_name: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  primary_domain: z.string().optional(),
  third_party_domain: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Market schemas
export const marketSchema = z.object({
  name: z.string().min(1, 'Market name is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Currency code must be 3 characters'),
  organization_id: z.string().uuid('Invalid organization ID'),
  is_active: z.boolean().default(true),
});

// Channel segment schemas
export const channelSegmentSchema = z.object({
  segment_type: z.string().min(1, 'Segment type is required'),
  market_id: z.string().uuid('Invalid market ID'),
  organization_id: z.string().uuid('Invalid organization ID'),
  is_active: z.boolean().default(true),
});

// Channel schemas
export const channelSchema = z.object({
  channel_type: z.string().min(1, 'Channel type is required'),
  description: z.string().optional(),
  segment_id: z.string().uuid('Invalid segment ID'),
  market_id: z.string().uuid('Invalid market ID'),
  organization_id: z.string().uuid('Invalid organization ID'),
  price_index_multiplier: z.number().positive().optional(),
  is_active: z.boolean().default(true),
});

// Outlet schemas
export const outletSchema = z.object({
  outlet_name: z.string().min(1, 'Outlet name is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  channel_id: z.string().uuid('Invalid channel ID'),
  organization_id: z.string().uuid('Invalid organization ID'),
  is_active: z.boolean().default(true),
});

// User profile schemas
export const userProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['super_user', 'power_user', 'market_admin', 'representative']),
  organization_id: z.string().uuid('Invalid organization ID'),
  market_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type OrganizationFormData = z.infer<typeof organizationSchema>;
export type MarketFormData = z.infer<typeof marketSchema>;
export type ChannelSegmentFormData = z.infer<typeof channelSegmentSchema>;
export type ChannelFormData = z.infer<typeof channelSchema>;
export type OutletFormData = z.infer<typeof outletSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
