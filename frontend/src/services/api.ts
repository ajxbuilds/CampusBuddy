import {
  AuthResponse,
  User,
  Complaint,
  ComplaintCategory,
  ComplaintEscalation,
  CommunityPost,
  CommunityAnswer,
  Badge,
  UserBadge,
  PointTransaction,
  LeaderboardResponse,
  AppNotification,
  AdminStats,
  CategoryDistribution,
  ComplaintsTrendPoint,
  AuditLog,
  ReportResponse,
  AIChatMessage,
  AIChatResponse,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

function getToken(): string | null {
  return localStorage.getItem('cb_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: any) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>('/auth/me'),

  listStudents: () => request<User[]>('/auth/students'),
  listStaff: () => request<User[]>('/auth/staff'),

  // Complaints
  getCategories: () => request<ComplaintCategory[]>('/complaints/categories'),

  listComplaints: (params?: { category_id?: number; status_filter?: string; priority_filter?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params?.status_filter && params.status_filter !== 'ALL') searchParams.append('status_filter', params.status_filter);
    if (params?.priority_filter && params.priority_filter !== 'ALL') searchParams.append('priority_filter', params.priority_filter);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Complaint[]>(`/complaints/${query}`);
  },

  getComplaint: (id: number) => request<Complaint>(`/complaints/${id}`),

  createComplaint: (data: {
    title: string;
    description: string;
    category_id: number;
    priority: string;
    attachment_url?: string;
  }) =>
    request<Complaint>('/complaints/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateComplaint: (
    id: number,
    data: {
      status?: string;
      assigned_to?: number;
      priority?: string;
      remarks?: string;
    }
  ) =>
    request<Complaint>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Escalation
  requestEscalation: (complaintId: number, data: { reason: string; level: string }) =>
    request<ComplaintEscalation>(`/escalations/${complaintId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewEscalation: (
    escalationId: number,
    data: {
      status: string;
      admin_notes?: string;
      assigned_to?: number;
      priority?: string;
    }
  ) =>
    request<ComplaintEscalation>(`/escalations/${escalationId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Community
  listPosts: (params?: { category?: string; sort_by?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.search) searchParams.append('search', params.search);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<CommunityPost[]>(`/community/posts${query}`);
  },

  getPost: (id: number) => request<CommunityPost>(`/community/posts/${id}`),

  createPost: (data: { title: string; content: string; category: string }) =>
    request<CommunityPost>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createAnswer: (postId: number, content: string) =>
    request<CommunityAnswer>(`/community/posts/${postId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  toggleVote: (targetType: 'POST' | 'ANSWER', targetId: number) =>
    request<{ status: string; action: string; new_upvotes: number }>('/community/vote', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    }),

  acceptAnswer: (answerId: number) =>
    request<{ status: string; message: string }>(`/community/answers/${answerId}/accept`, {
      method: 'PATCH',
    }),

  reportContent: (targetType: 'POST' | 'ANSWER', targetId: number, reason: string) =>
    request<ReportResponse>('/community/reports', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    }),

  // Gamification
  listBadges: () => request<Badge[]>('/gamification/badges'),
  getMyBadges: () => request<UserBadge[]>('/gamification/my-badges'),
  getMyTransactions: () => request<PointTransaction[]>('/gamification/my-transactions'),
  getLeaderboard: (period: 'weekly' | 'monthly' | 'all-time' = 'all-time') =>
    request<LeaderboardResponse>(`/gamification/leaderboard?period=${period}`),

  // AI Assistant
  askAI: (messages: AIChatMessage[], contextCategory?: string) =>
    request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context_category: contextCategory }),
    }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/notifications/'),
  markNotificationRead: (id: number) =>
    request<{ status: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ status: string; updated: number }>('/notifications/mark-all-read', { method: 'POST' }),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  listAdminUsers: (role?: string, search?: string) => {
    const sp = new URLSearchParams();
    if (role && role !== 'ALL') sp.append('role', role);
    if (search) sp.append('search', search);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return request<User[]>(`/admin/users${q}`);
  },
  updateUserRole: (userId: number, data: { role: string; department?: string; is_active?: boolean }) =>
    request<User>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listReports: (statusFilter?: string) => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<ReportResponse[]>(`/admin/reports${q}`);
  },
  handleReport: (reportId: number, action: 'dismiss' | 'hide_content', adminNotes?: string) => {
    const q = new URLSearchParams({ action });
    if (adminNotes) q.append('admin_notes', adminNotes);
    return request<{ status: string; report_status: string }>(`/admin/reports/${reportId}?${q.toString()}`, {
      method: 'PATCH',
    });
  },
  listAuditLogs: () => request<AuditLog[]>('/admin/audit-logs'),

  // Analytics
  getCategoryDistribution: () => request<CategoryDistribution[]>('/analytics/by-category'),
  getTrends: (days = 7) => request<ComplaintsTrendPoint[]>(`/analytics/trends?days=${days}`),
};
