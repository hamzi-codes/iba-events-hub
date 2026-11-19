import { useCallback, useState } from 'react';

// Field errors for a form. When a field changes, its error (and the errors that depend on it)
// disappear, so the red text never stays after the user has fixed the field (FR-SUB-05).
const RELATED = {
  date: ['date', 'startTime', 'endTime'],
  startTime: ['startTime', 'endTime'],
  endTime: ['startTime', 'endTime'],
  venueChoice: ['venueChoice', 'capacity'],
  organisationId: ['organisationId', 'eventType'],
};

export default function useFieldErrors() {
  const [errors, setErrors] = useState({});
  const clearFor = useCallback((changes) => {
    const keys = [];
    Object.keys(changes).forEach((key) => keys.push(...(RELATED[key] || [key])));
    setErrors((current) => {
      if (!keys.some((key) => key in current)) return current;
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }, []);
  return { errors, setErrors, clearFor };
}
