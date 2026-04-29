import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"
import { authApi } from "@/api"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  toggleSidebar: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      sidebarCollapsed: false,

      login: async (email: string, password: string): Promise<boolean> => {
        try {
          const { data } = await authApi.login(email, password)
          localStorage.setItem("accessToken", data.accessToken)
          localStorage.setItem("refreshToken", data.refreshToken)
          set({ user: data.user, isAuthenticated: true })
          return true
        } catch {
          return false
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem("refreshToken") ?? undefined
          await authApi.logout(refreshToken)
        } finally {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          set({ user: null, isAuthenticated: false })
        }
      },

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      restoreSession: async () => {
        const token = localStorage.getItem("accessToken")
        if (!token) return
        try {
          const { data } = await authApi.me()
          set({ user: data, isAuthenticated: true })
        } catch {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: "globaltrack-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
