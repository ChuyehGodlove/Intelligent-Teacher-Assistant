import React, { createContext, useContext, useState, useEffect } from "react";

interface StudentInfo {
  studentCode: string;
  studentId?: number;
  studentName?: string;
  classId?: number;
  className?: string;
}

interface StudentContextType {
  studentCode: string | null;
  studentInfo: StudentInfo | null;
  setStudentCode: (code: string | null) => void;
  setStudentInfo: (info: StudentInfo) => void;
  logout: () => void;
}

const StudentContext = createContext<StudentContextType>({
  studentCode: null,
  studentInfo: null,
  setStudentCode: () => {},
  setStudentInfo: () => {},
  logout: () => {},
});

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [studentInfo, setStudentInfoState] = useState<StudentInfo | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("studentInfo");
    if (saved) {
      try { setStudentInfoState(JSON.parse(saved)); } catch {}
    }
  }, []);

  const setStudentCode = (code: string | null) => {
    if (code) {
      const info = { studentCode: code };
      localStorage.setItem("studentInfo", JSON.stringify(info));
      setStudentInfoState(info);
    } else {
      localStorage.removeItem("studentInfo");
      setStudentInfoState(null);
    }
  };

  const setStudentInfo = (info: StudentInfo) => {
    localStorage.setItem("studentInfo", JSON.stringify(info));
    setStudentInfoState(info);
  };

  const logout = () => {
    localStorage.removeItem("studentInfo");
    setStudentInfoState(null);
  };

  return (
    <StudentContext.Provider
      value={{
        studentCode: studentInfo?.studentCode ?? null,
        studentInfo,
        setStudentCode,
        setStudentInfo,
        logout,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => useContext(StudentContext);
