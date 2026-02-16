import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Custom hook to poll the status of study material generation.
 * @param {string} courseId - The ID of the course.
 * @param {string} type - The type of study material (flashcard, quiz, notes).
 * @returns {Object} { status, isGenerating, isCompleted, isFailed, checkStatus }
 */
export function useStudyStatus(courseId, type) {
  const [status, setStatus] = useState("pending");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  
  // Use statusRef to access current status inside intervals without dependency cycles
  const statusRef = useRef(status);
  statusRef.current = status;

  const pollingStartTimeRef = useRef(null);

  const fetchStatus = useCallback(async (abortSignal) => {
    if (!courseId || !type) return;

    try {
      const response = await axios.get(
        `/api/study-status?courseId=${courseId}&type=${type}`,
        { signal: abortSignal }
      );
      
      const newStatus = response.data.status?.toLowerCase() || "pending";
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error("Error fetching study status:", error);
      // Optional: set failed on error? For now, keep previous status or pending
    }
  }, [courseId, type]);

  // Initial fetch
  useEffect(() => {
    const controller = new AbortController();
    fetchStatus(controller.signal);
    return () => controller.abort();
  }, [fetchStatus]);

  // Polling logic
  useEffect(() => {
    if (status !== "generating") {
      setIsGenerating(false);
      setIsCompleted(status === "completed" || status === "cms"); // cms might be a synonym for completed in some contexts, but sticking to basics
      setIsFailed(status === "failed");
      pollingStartTimeRef.current = null; // Reset start time
      return;
    }

    setIsGenerating(true);
    setIsCompleted(false);
    setIsFailed(false);

    // Initialize start time if not set
    if (!pollingStartTimeRef.current) {
        pollingStartTimeRef.current = Date.now();
    }

    const controller = new AbortController();
    const intervalId = setInterval(async () => {
      // 1. Timeout Check (2 minutes)
      if (Date.now() - pollingStartTimeRef.current > 120000) {
        setStatus("failed"); // Or specific timeout status
        clearInterval(intervalId);
        return;
      }

      // 2. Poll
      const currentStatus = await fetchStatus(controller.signal);
      
      // 3. Check for terminal states
      if (currentStatus === "completed" || currentStatus === "failed") {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [status, fetchStatus]);

  return {
    status,
    isGenerating,
    isCompleted,
    isFailed,
    checkStatus: () => fetchStatus(), // Manual re-check if needed
    setStatus, // Allow manual override (e.g., setting "generating" immediately after trigger)
  };
}
