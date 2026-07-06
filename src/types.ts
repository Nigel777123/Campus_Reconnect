// ── Item types ──────────────────────────────────────────────────────────────
export type ItemType = "lost" | "found";

export type ItemStatus = "active" | "resolved" | "deleted";

export type Category =
  | "electronics"
  | "id_cards"
  | "clothing"
  | "keys"
  | "bags"
  | "books"
  | "other";

export interface VerificationQuestion {
  question: string;
}

export interface Item {
  id: number;
  user_id: number;
  type: ItemType;
  title: string;
  description: string;
  category: Category;
  location: string;
  date: string;
  image_url?: string;
  contact_info?: string;
  verification_questions: string; // JSON array of {question} objects
  verification_answers?: string;  // JSON array of strings — only visible to owner
  status: ItemStatus;
  resolved_at?: string;
  created_at: string;
  poster_name?: string;
}

// ── Claim types ─────────────────────────────────────────────────────────────
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface Claim {
  id: number;
  item_id: number;
  claimant_id: number;
  claimant_name: string;
  claimant_contact: string;
  submitted_answers: string; // JSON array of strings
  status: ClaimStatus;
  created_at: string;
  // Joined fields
  claimant_name_display?: string;
  claimant_email?: string;
  item_title?: string;
  item_type?: ItemType;
  item_status?: ItemStatus;
  poster_name?: string;
  image_url?: string;
}

// ── Message types ────────────────────────────────────────────────────────────
export interface Message {
  id: number;
  claim_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

// ── User types ───────────────────────────────────────────────────────────────
export type UserRole = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

// ── Notification types ───────────────────────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body?: string;
  read: number;
  ref_id?: number;
  created_at: string;
}

// ── Dashboard types ──────────────────────────────────────────────────────────
export interface DashboardData {
  myPosts: Item[];
  myClaims: Claim[];
  pendingMap: Record<number, number>;
}

// ── Filter types ─────────────────────────────────────────────────────────────
export interface ItemFilters {
  q?: string;
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  date_from?: string;
  dateFrom?: string;
  date_to?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ── Campus buildings ─────────────────────────────────────────────────────────
export const CAMPUS_BUILDINGS = [
  "Main Library",
  "Student Union",
  "Science Complex",
  "Engineering Building",
  "Arts & Humanities Hall",
  "Business School",
  "Cafeteria / Dining Hall",
  "Recreation Center / Gym",
  "Sports Field / Stadium",
  "Dormitory A",
  "Dormitory B",
  "Dormitory C",
  "Parking Lot A",
  "Parking Lot B",
  "Administration Building",
  "Health Center",
  "Lecture Hall North",
  "Lecture Hall South",
  "Computer Lab",
  "Campus Shuttle Stop",
  "Other / Unknown",
];

// ── Category metadata ────────────────────────────────────────────────────────
export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  electronics: { label: "Electronics", emoji: "📱" },
  id_cards: { label: "ID / Cards", emoji: "🪪" },
  clothing: { label: "Clothing", emoji: "👕" },
  keys: { label: "Keys", emoji: "🔑" },
  bags: { label: "Bags", emoji: "🎒" },
  books: { label: "Books", emoji: "📚" },
  other: { label: "Other", emoji: "📦" },
};
