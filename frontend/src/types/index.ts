export type UserRole = 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';

export interface StudentProfile {
  id: number;
  roll_number: string;
  semester: number;
  program: string;
  total_points: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  auth_provider?: string;
  is_active: boolean;
  created_at: string;
  student_profile?: StudentProfile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface GoogleAuthStatus {
  configured: boolean;
  client_id?: string | null;
  redirect_uri: string;
}

export interface GoogleAuthUrlResponse {
  configured: boolean;
  url?: string | null;
  message?: string | null;
}

export interface GoogleOnboardRequest {
  onboarding_token: string;
  role: UserRole;
  department?: string;
  phone?: string;
  roll_number?: string;
  semester?: number;
  program?: string;
  parent_link_code?: string;
}

export interface ComplaintCategory {
  id: number;
  name: string;
  code: string;
  department: string;
  sla_hours: number;
  description?: string | null;
}

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_INFORMATION'
  | 'RESOLVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'CLOSED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EscalationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ComplaintStatusHistory {
  id: number;
  from_status?: string | null;
  to_status: string;
  remarks?: string | null;
  created_at: string;
  actor?: User | null;
}

export interface ComplaintEscalation {
  id: number;
  complaint_id: number;
  level: string;
  reason: string;
  sla_breached: boolean;
  status: EscalationStatus;
  admin_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  requester?: User | null;
}

export interface Complaint {
  id: number;
  complaint_code: string;
  student_id: number;
  category_id: number;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assigned_to?: number | null;
  attachment_url?: string | null;
  is_escalated: boolean;
  sla_deadline?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  category?: ComplaintCategory | null;
  student?: User | null;
  assignee?: User | null;
  history?: ComplaintStatusHistory[];
  escalations?: ComplaintEscalation[];
}

export interface CommunityAnswer {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  upvotes_count: number;
  is_accepted: boolean;
  is_faculty_endorsed: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author?: User | null;
  has_voted?: boolean;
}

export interface CommunityPost {
  id: number;
  author_id: number;
  title: string;
  content: string;
  category: string;
  views: number;
  upvotes_count: number;
  answers_count: number;
  has_accepted_answer: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author?: User | null;
  has_voted?: boolean;
  answers?: CommunityAnswer[];
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  points_threshold: number;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  awarded_at: string;
  badge?: Badge | null;
}

export interface PointTransaction {
  id: number;
  user_id: number;
  points: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: number | null;
  created_at: string;
}

export interface LeaderboardUser {
  user_id: number;
  full_name: string;
  department?: string | null;
  role: string;
  avatar_url?: string | null;
  points: number;
  rank: number;
  badges: Badge[];
}

export interface LeaderboardResponse {
  period: string;
  leaders: LeaderboardUser[];
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'COMPLAINT' | 'COMMUNITY' | 'BADGE' | 'SYSTEM';
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminStats {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  escalated_complaints: number;
  total_community_posts: number;
  total_users: number;
  active_students: number;
  resolution_rate_percent: number;
  avg_resolution_time_hours: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  resolved_count: number;
}

export interface ComplaintsTrendPoint {
  date: string;
  count: number;
  resolved: number;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
  actor?: User | null;
}

export interface ReportResponse {
  id: number;
  reporter_id: number;
  target_type: 'POST' | 'ANSWER';
  target_id: number;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  admin_notes?: string | null;
  created_at: string;
  reporter?: User | null;
}

export interface AIProcedureAdvice {
  suggested_category?: string | null;
  suggested_priority?: string;
  recommended_action: 'PEER_COMMUNITY' | 'FORMAL_COMPLAINT' | 'VISIT_OFFICE' | 'INFORMATIONAL';
  required_documents: string[];
  contact_office?: string | null;
  guidance_text: string;
  disclaimer: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatResponse {
  reply: string;
  structured_advice?: AIProcedureAdvice | null;
}

export interface StudyBuddyProfile {
  id: number;
  user_id: number;
  skills?: string;
  interests?: string;
  help_areas?: string;
  goals?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyBuddyProfileCreate {
  skills?: string;
  interests?: string;
  help_areas?: string;
  goals?: string;
  is_active: boolean;
}

export interface StudyBuddyDiscover {
  profile_id: number;
  user_id: number;
  name: string;
  avatar_url?: string;
  department?: string;
  skills?: string;
  interests?: string;
  help_areas?: string;
  goals?: string;
}

export interface StudyBuddyRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface StudyBuddyConnection {
  connection_id: number;
  connected_at: string;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
    department?: string;
  };
}

export interface ParentLinkCodeResponse {
  code: string;
  expires_at: string;
  is_active: boolean;
}

