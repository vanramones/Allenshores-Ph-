import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookmarksAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const BookmarkContext = createContext(null);

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};

// Generate or get session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await bookmarksAPI.getAll(sessionId);
      setBookmarks(response.data);
      setBookmarkedIds(new Set(response.data.map(b => b.beach_id)));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (beachId) => {
    try {
      const response = await bookmarksAPI.toggle(beachId, sessionId);
      if (response.data.bookmarked) {
        setBookmarkedIds(prev => new Set([...prev, beachId]));
      } else {
        setBookmarkedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(beachId);
          return newSet;
        });
      }
      await fetchBookmarks();
      return response.data.bookmarked;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  };

  const isBookmarked = (beachId) => {
    return bookmarkedIds.has(beachId);
  };

  const value = {
    bookmarks,
    bookmarkedIds,
    loading,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: fetchBookmarks,
    bookmarkCount: bookmarks.length
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export default BookmarkContext;
