import type { Industry, LeadStatus, ActivityType, TaskType } from "@/generated/prisma/enums";

export const INDUSTRY_LABELS: Record<Industry, { en: string; zh: string; color: string }> = {
  F_AND_B:        { en: "F&B",           zh: "飲食",   color: "bg-orange-100 text-orange-700 border-orange-200" },
  MEDICAL_BEAUTY: { en: "Medical Beauty", zh: "醫美",   color: "bg-pink-100 text-pink-700 border-pink-200" },
  BEAUTY:         { en: "Beauty",         zh: "美容",   color: "bg-purple-100 text-purple-700 border-purple-200" },
  FOOT:           { en: "Foot",           zh: "足療",   color: "bg-teal-100 text-teal-700 border-teal-200" },
  OTHER:          { en: "Other",          zh: "其他",   color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export const STATUS_LABELS: Record<LeadStatus, { en: string; zh: string; color: string; icon: string }> = {
  LEAD:        { en: "Lead",        zh: "潛在客戶", icon: "🎯", color: "bg-gray-100 text-gray-600 border-gray-200" },
  CONTACTED:   { en: "Contacted",   zh: "已接觸",   icon: "👋", color: "bg-blue-100 text-blue-700 border-blue-200" },
  DEMO:        { en: "Demo",        zh: "提案中",   icon: "📊", color: "bg-purple-100 text-purple-700 border-purple-200" },
  OBJECTION:   { en: "Objection",   zh: "處理反對", icon: "🤔", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  CLOSED_WON:  { en: "Closed Won",  zh: "成交",     icon: "🏆", color: "bg-green-100 text-green-700 border-green-200" },
  CLOSED_LOST: { en: "Closed Lost", zh: "失敗",     icon: "❌", color: "bg-red-100 text-red-600 border-red-200" },
};

export const ACTIVITY_LABELS: Record<ActivityType, { en: string; zh: string; icon: string; color: string }> = {
  WALK_IN:  { en: "Walk-in",         zh: "親自拜訪",      icon: "🚶", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  PHONE:    { en: "Phone Call",      zh: "打電話",        icon: "📞", color: "bg-blue-100 text-blue-700 border-blue-300" },
  WHATSAPP: { en: "WhatsApp",        zh: "WhatsApp",      icon: "💬", color: "bg-green-100 text-green-700 border-green-300" },
  PIPELINE: { en: "Pipeline Update", zh: "Pipeline 更新", icon: "🔄", color: "bg-violet-100 text-violet-700 border-violet-300" },
  MEETING:  { en: "Meeting",         zh: "面談",          icon: "🤝", color: "bg-indigo-100 text-indigo-700 border-indigo-300" },
  EMAIL:    { en: "Email",           zh: "電郵",          icon: "📧", color: "bg-sky-100 text-sky-700 border-sky-300" },
};

export const TASK_TYPE_META: Record<TaskType, { zh: string; icon: string; activityType: ActivityType }> = {
  MEETING: { zh: "面談",     icon: "🤝", activityType: "MEETING" },
  CALL:    { zh: "跟進電話", icon: "📞", activityType: "PHONE"   },
  EMAIL:   { zh: "電郵",     icon: "📧", activityType: "EMAIL"   },
};

export const ALL_INDUSTRIES = Object.keys(INDUSTRY_LABELS) as Industry[];
export const ALL_STATUSES   = Object.keys(STATUS_LABELS)   as LeadStatus[];
export const ALL_ACTIVITIES = Object.keys(ACTIVITY_LABELS) as ActivityType[];
export const ALL_TASK_TYPES = Object.keys(TASK_TYPE_META)  as TaskType[];
