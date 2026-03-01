import { useState, useCallback } from 'react';
import api from '../config/api';
import type { Comment } from '../types';

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (listingId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<Comment[]>(`/comments/listing/${listingId}`);
      setComments(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const createComment = useCallback(async (data: { listingId: string; text: string; parentId?: string }): Promise<boolean> => {
    try {
      await api.post('/comments', data);
      return true;
    } catch { return false; }
  }, []);

  const deleteComment = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/comments/${id}`);
      return true;
    } catch { return false; }
  }, []);

  return { comments, loading, fetchComments, createComment, deleteComment };
};
