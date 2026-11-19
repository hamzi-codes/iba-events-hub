import { useEffect, useRef, useState } from 'react';

import { getConflict } from '../api/events';
import { toUtcIso } from '../utils/dates';
import { ONLINE } from '../utils/eventForm';

// Live venue and time check while the organiser fills the form (FR-CNF-02, Section 5.10).
// It runs about 400 ms after the last change, once venue, date, start and end are all chosen.
//   status: 'idle' (nothing to check), 'checking', 'clear', 'conflict', or 'error'
// A failed check ('error') does not block the form, because the server checks again on submit.
const DELAY_MS = 400;

export default function useConflictCheck({ venueChoice, date, startTime, endTime, excludeEventId }) {
  const [state, setState] = useState({ status: 'idle', clashingEvent: null, error: null });
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current;
    const physical = venueChoice && venueChoice !== ONLINE;
    if (!physical || !date || !startTime || !endTime) {
      setState({ status: 'idle', clashingEvent: null, error: null });
      return undefined;
    }
    const startAt = toUtcIso(date, startTime);
    const endAt = toUtcIso(date, endTime);
    if (Date.parse(endAt) <= Date.parse(startAt)) {
      setState({ status: 'idle', clashingEvent: null, error: null }); // the form shows the time error
      return undefined;
    }

    setState({ status: 'checking', clashingEvent: null, error: null });
    const timer = setTimeout(async () => {
      try {
        const result = await getConflict({ venueId: venueChoice, startAt, endAt, excludeEventId });
        if (id !== latest.current) return; // an older answer, ignore it
        setState(
          result.conflict
            ? { status: 'conflict', clashingEvent: result.clashingEvent, error: null }
            : { status: 'clear', clashingEvent: null, error: null }
        );
      } catch (error) {
        if (id !== latest.current) return;
        setState({ status: 'error', clashingEvent: null, error });
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [venueChoice, date, startTime, endTime, excludeEventId]);

  return state;
}
