import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('cafe_auth_user')
    if (raw) setUser(JSON.parse(raw))
  }, [])

  const login = (u) => {
    setUser(u)
    localStorage.setItem('cafe_auth_user', JSON.stringify(u))
  }
  const logout = () => {
    setUser(null)
    localStorage.removeItem('cafe_auth_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
