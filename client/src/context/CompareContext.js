import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext(null);

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState(() => {
    const saved = localStorage.getItem('compareList');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (beach) => {
    if (compareList.length >= 3) {
      return { success: false, message: 'Maximum 3 beaches can be compared' };
    }
    if (compareList.find(b => b.id === beach.id)) {
      return { success: false, message: 'Beach already in compare list' };
    }
    setCompareList(prev => [...prev, beach]);
    return { success: true, message: 'Added to compare' };
  };

  const removeFromCompare = (beachId) => {
    setCompareList(prev => prev.filter(b => b.id !== beachId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (beachId) => {
    return compareList.some(b => b.id === beachId);
  };

  const value = {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    compareCount: compareList.length
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};

export default CompareContext;
