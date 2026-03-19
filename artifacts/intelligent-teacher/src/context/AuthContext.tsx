import React, { createContext, useContext, useState, useEffect } from "react";

export type AuthRole = "teacher" | "student" | null;

export interface TeacherUser {
  id: number;
  name: string;
  email: string;
}

export interface StudentUser {
  id: number;
  name: string;
  email?: string;
  studentCode: string;
  classId?: number;
  className?: string;
}

interface AuthState {
  role: AuthRole;
  token: string | null;
  teacher: TeacherUser | null;
  student: StudentUser | null;
}

interface AuthContextType extends AuthState {
  loginTeacher: (token: string, user: TeacherUser) => void;
  loginStudent: (token: string, user: StudentUser) => void;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
}

const defaultState: AuthContextType = {
  role: null,
  token: null,
  teacher: null,
  student: null,
  loginTeacher: () => {},
  loginStudent: () => {},
  logout: () => {},
  isTeacher: false,
  isStudent: false,
};

const AuthContext = createContext<AuthContextType>(defaultState);

const STORAGE_KEY = "intelliteach_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    role: null,
    token: null,
    teacher: null,
    student: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        setState(parsed);
      } catch {}
    }
  }, []);

  const save = (newState: AuthState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const loginTeacher = (token: string, user: TeacherUser) => {
    save({ role: "teacher", token, teacher: user, student: null });
  };

  const loginStudent = (token: string, user: StudentUser) => {
    save({ role: "student", token, teacher: null, student: user });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear old student info key
    localStorage.removeItem("studentInfo");
    setState({ role: null, token: null, teacher: null, student: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginTeacher,
        loginStudent,
        logout,
        isTeacher: state.role === "teacher",
        isStudent: state.role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
