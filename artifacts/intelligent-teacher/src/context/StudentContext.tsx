import React, { createContext, useContext, useState, useEffect } from "react";

interface StudentContextType {
  studentCode: string | null;
  setStudentCode: (code: string | null) => void;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType>({
  studentCode: null,
  setStudentCode: () => {},
  logout: () => {},
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [studentCode, setStudentCodeState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("studentCode");
    if (saved) setStudentCodeState(saved);
  }, []);

  const setStudentCode = (code: string | null) => {
    if (code) localStorage.setItem("studentCode", code);
    else localStorage.removeItem("studentCode");
    setStudentCodeState(code);
  };

  const logout = () => {
    localStorage.removeItem("studentCode");
    setStudentCodeState(null);
  };

  return (
    <StudentContext.Provider value={{ studentCode, setStudentCode, logout }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => useContext(StudentContext);
