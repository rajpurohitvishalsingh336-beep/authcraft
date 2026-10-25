export interface Developer {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AllowedOrigin {
  id: string;
  origin: string;
  created_at: string;
}

export interface AllowedRedirectUri {
  id: string;
  redirect_uri: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'disabled';
  is_published: boolean;
  published_version: number;
  allow_registration: boolean;
  allow_otp_login?: boolean;
  require_email_verification: boolean;
  session_duration_minutes: number;
  password_min_length: number;
  hosted_login_url: string;
  created_at: string;
  updated_at: string;
  total_users: number;
  total_events: number;
  allowed_origins: AllowedOrigin[];
  allowed_redirect_uris: AllowedRedirectUri[];
}

export interface ProjectConfiguration {
  id?: string;
  project_id?: string;
  version?: number;
  is_published?: boolean;
  brand_name: string;
  page_title: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  card_background_color: string;
  text_color: string;
  theme_mode: 'light' | 'dark';
  template_name: 'modern' | 'minimal' | 'professional' | 'dark' | 'startup' | 'classic';
  layout_style: 'card' | 'simple';
  form_width: 'sm' | 'md' | 'lg';
  form_alignment: 'left' | 'center' | 'right';
  button_style: 'solid' | 'outline' | 'rounded' | 'pill';
  input_style: 'outline' | 'filled' | 'underlined';
  font_family: 'Inter' | 'Roboto' | 'Poppins' | 'Outfit' | 'System';
  border_radius: number;
  welcome_message: string;
  login_text: string;
  register_text: string;
  email_label: string;
  password_label: string;
  footer_text: string;
  show_password_toggle: boolean;
  show_forgot_password: boolean;
  show_registration: boolean;
  allow_otp_login?: boolean;
  custom_css_vars?: string | null;
  layout_id?: string;
  layout_tokens?: Record<string, any>;
}

export interface ApplicationUser {
  id: string;
  project_id: string;
  email: string;
  display_name: string | null;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AuthEvent {
  id: string;
  project_id: string;
  user_id: string | null;
  event_type: string;
  status: 'success' | 'failure';
  email_attempted: string | null;
  ip_address: string | null;
  user_agent: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface PublicProjectConfig extends ProjectConfiguration {
  status: 'ready' | 'unpublished' | 'disabled';
  project_name?: string;
  project_slug?: string;
  allow_registration?: boolean;
  allow_otp_login?: boolean;
  require_email_verification?: boolean;
  password_min_length?: number;
  message?: string;
}
