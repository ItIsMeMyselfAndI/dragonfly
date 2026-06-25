"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type SheetContextType = {
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextType>({
  isSheetOpen: false,
  setIsSheetOpen: () => {},
});

export const SheetProvider = ({ children }: { children: ReactNode }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  return (
    <SheetContext.Provider value={{ isSheetOpen, setIsSheetOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

export const useSheet = () => useContext(SheetContext);
