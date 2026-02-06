"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  profile: null,
  loading: true,

  fetchProfile: async () => {
    set({ loading: true });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      set({ profile: null, loading: false });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    set({ profile: profile as Profile | null, loading: false });
  },

  clearProfile: () => set({ profile: null, loading: false }),
}));
