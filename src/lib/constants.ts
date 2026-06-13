import type { Industry, LeadStatus, ActivityType, TaskType } from "@/generated/prisma/enums";

export const INDUSTRY_LABELS: Record<Industry, { en: string; zh: string; color: string; bar: string }> = {
  F_AND_B:        { en: "F&B",           zh: "飲食", color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-600" },
  MEDICAL_BEAUTY: { en: "Medical Beauty", zh: "醫美", color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500" },
  BEAUTY:         { en: "Beauty",         zh: "美容", color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-400" },
  FOOT:           { en: "Foot",           zh: "足療", color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-300" },
  OTHER:          { en: "Other",          zh: "其他", color: "bg-zinc-100 text-zinc-600 border-zinc-200",       bar: "bg-zinc-400"   },
};

export const STATUS_LABELS: Record<LeadStatus, { en: string; zh: string; color: string; icon: string }> = {
  LEAD:        { en: "Lead",        zh: "潛在客戶", icon: "", color: "bg-zinc-100 text-zinc-600 border-zinc-200"         },
  CONTACTED:   { en: "Contacted",   zh: "已接觸",   icon: "", color: "bg-orange-100 text-orange-700 border-orange-200"  },
  DEMO:        { en: "Demo",        zh: "提案中",   icon: "", color: "bg-orange-200 text-orange-800 border-orange-300"  },
  OBJECTION:   { en: "Objection",   zh: "處理反對", icon: "", color: "bg-orange-300 text-orange-900 border-orange-400"  },
  CLOSED_WON:  { en: "Closed Won",  zh: "成交",     icon: "", color: "bg-orange-600 text-white border-orange-600"       },
  CLOSED_LOST: { en: "Closed Lost", zh: "失敗",     icon: "", color: "bg-zinc-200 text-zinc-600 border-zinc-300"        },
};

export const ACTIVITY_LABELS: Record<ActivityType, { en: string; zh: string; icon: string; color: string }> = {
  WALK_IN:  { en: "Walk-in",         zh: "親自拜訪",      icon: "", color: "bg-orange-100 text-orange-700 border-orange-200" },
  PHONE:    { en: "Phone Call",      zh: "打電話",        icon: "", color: "bg-orange-200 text-orange-800 border-orange-300" },
  WHATSAPP: { en: "WhatsApp",        zh: "WhatsApp",      icon: "", color: "bg-orange-50  text-orange-600 border-orange-100" },
  PIPELINE: { en: "Pipeline Update", zh: "Pipeline 更新", icon: "", color: "bg-orange-300 text-orange-900 border-orange-400" },
  MEETING:  { en: "Meeting",         zh: "面談",          icon: "", color: "bg-orange-500 text-white border-orange-500"      },
  EMAIL:    { en: "Email",           zh: "電郵",          icon: "", color: "bg-zinc-100 text-zinc-600 border-zinc-200"       },
};

export const TASK_TYPE_META: Record<TaskType, { zh: string; icon: string; activityType: ActivityType }> = {
  MEETING: { zh: "面談",     icon: "", activityType: "MEETING" },
  CALL:    { zh: "跟進電話", icon: "", activityType: "PHONE"   },
  EMAIL:   { zh: "電郵",     icon: "", activityType: "EMAIL"   },
};

export const HK_DISTRICTS = [
  // 九龍
  "尖沙咀", "旺角", "油麻地", "佐敦", "深水埗",
  "黃大仙", "九龍城", "土瓜灣", "紅磡", "觀塘", "藍田", "牛頭角", "秀茂坪",
  // 港島
  "銅鑼灣", "中環", "上環", "灣仔", "北角", "天后", "西環", "筲箕灣", "柴灣", "跑馬地",
  // 新界
  "荃灣", "元朗", "沙田", "屯門", "大埔", "粉嶺", "上水",
  "將軍澳", "天水圍", "葵涌", "青衣", "馬鞍山",
];

export const ALL_INDUSTRIES = Object.keys(INDUSTRY_LABELS) as Industry[];
export const ALL_STATUSES   = Object.keys(STATUS_LABELS)   as LeadStatus[];
export const ALL_ACTIVITIES = Object.keys(ACTIVITY_LABELS) as ActivityType[];
export const ALL_TASK_TYPES = Object.keys(TASK_TYPE_META)  as TaskType[];
