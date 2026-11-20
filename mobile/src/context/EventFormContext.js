import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { EMPTY_FORM, formFromEvent } from '../utils/eventForm';

// Holds what the organiser has typed across the new event screens (step 1, step 2, review),
// so going Back never loses anything and a failed request keeps the data (NFR-REL-03).
// editingId is set when an event with Changes Requested is being edited (screen 14).
const EventFormContext = createContext(null);

export function EventFormProvider({ children }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const patch = useCallback((changes) => setForm((current) => ({ ...current, ...changes })), []);
  const startNew = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);
  const startEdit = useCallback((event) => {
    setForm(formFromEvent(event));
    setEditingId(event.id);
  }, []);

  const value = useMemo(() => ({ form, patch, editingId, startNew, startEdit }), [form, patch, editingId, startNew, startEdit]);
  return <EventFormContext.Provider value={value}>{children}</EventFormContext.Provider>;
}

export function useEventForm() {
  const context = useContext(EventFormContext);
  if (!context) throw new Error('useEventForm must be used inside <EventFormProvider>.');
  return context;
}
