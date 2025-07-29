import { createContext,  useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";

type User = {
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
};

type AuthContextType = {
  authToken?: string | null;
  user?: User | null;
  setCredentials: (userData: User, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated:boolean
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const setCredentials = async (userData: User, accessToken: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
      setAuthToken(accessToken); 
    setUser(userData);
  };

  const logout = async() => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    setAuthToken(null)
    navigate("/login");
  };

  const isAuthenticated = !!authToken;

  return (
    <AuthContext.Provider
      value={{ user, setCredentials, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};