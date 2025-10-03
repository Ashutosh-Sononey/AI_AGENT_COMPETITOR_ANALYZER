"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  location: string
  role: string
  company: string
  bio: string
  joinDate: string
  avatar: string
}

interface UserContextType {
  user: User | null
  updateUser: (data: Partial<User>) => void
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const defaultUser: User = {
  id: "user-1",
  name: "Sophia Miller",
  email: "sophia.miller@company.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  role: "Growth PM",
  company: "TechCorp Inc.",
  bio: "Passionate about competitive intelligence and market analysis. 5+ years of experience in product management and growth strategy.",
  joinDate: "January 2023",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("current-user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse stored user:", e)
        setUser(defaultUser)
      }
    } else {
      setUser(defaultUser)
    }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem("current-user", JSON.stringify(user))
    } else {
      localStorage.removeItem("current-user")
    }
  }, [user])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, accept any email/password
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      email,
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      role: "Product Manager",
      company: "TechCorp Inc.",
      bio: "Passionate about competitive intelligence and market analysis.",
      joinDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    }

    setUser(newUser)
    return true
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone: "",
      location: "",
      role: "Product Manager",
      company: "",
      bio: "",
      joinDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    }

    setUser(newUser)
    return true
  }

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("current-user")
    localStorage.removeItem("selected-competitors")
    window.location.href = "/signup"
  }

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
