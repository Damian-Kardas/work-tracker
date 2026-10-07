export type LocationLabel = "Biuro" | "Home office" | "Targi / wyjazd" | "Inne";
export type LeaveType = "Wypoczynkowy" | "Na zadanie" | "Okolicznosciowy" | "Inne";

// Wartosci LeaveType odpowiadaja dokladnie ograniczeniu CHECK w bazie (bez polskich znakow -
// zmiana wymagalaby migracji SQL). To sa tylko etykiety do wyswietlania w interfejsie.
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  Wypoczynkowy: "Wypoczynkowy",
  "Na zadanie": "Na żądanie",
  Okolicznosciowy: "Okolicznościowy",
  Inne: "Inne",
};

export interface Profile {
  id: string;
  full_name: string | null;
  standard_start_time: string; // "HH:MM:SS"
  standard_end_time: string;
  work_days: number[]; // 1 = poniedzialek ... 7 = niedziela
  annual_leave_days: number;
  timezone: string;
  reminder_start_enabled: boolean;
  reminder_end_enabled: boolean;
  overtime_cap_enabled: boolean;
  overtime_cap_hours: number;
  avatar_url: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  entry_date: string; // "YYYY-MM-DD"
  start_time: string; // ISO timestamp
  end_time: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  location_label: LocationLabel;
  notes: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveEntry {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  leave_type: LeaveType;
  notes: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  subscription: unknown;
  created_at: string;
}

// Minimalny ksztalt wymagany przez klienta Supabase (generic Database).
// Jesli kiedys zechcesz pelnej autogeneracji: `supabase gen types typescript`.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      time_entries: {
        Row: TimeEntry;
        Insert: Partial<TimeEntry> & { user_id: string; start_time: string };
        Update: Partial<TimeEntry>;
      };
      leave_entries: {
        Row: LeaveEntry;
        Insert: Partial<LeaveEntry> & {
          user_id: string;
          start_date: string;
          end_date: string;
          days_count: number;
        };
        Update: Partial<LeaveEntry>;
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> & { user_id: string; endpoint: string; subscription: unknown };
        Update: Partial<PushSubscriptionRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
