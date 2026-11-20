import React from 'react';
import { StyleSheet, View } from 'react-native';

import ConflictBanner from '../ConflictBanner';
import DateTimeField from '../DateTimeField';
import DropdownField from '../DropdownField';
import FormField from '../FormField';
import SwitchRow from '../SwitchRow';
import { ONLINE, extraFieldsFor } from '../../utils/eventForm';

// Date, times, venue (or Online), capacity, the two switches, and the speaker or thesis fields
// for those event types. The conflict message sits right under the Venue field (Section 16.2).
// Used on screen 11 and inside the Edit form (screen 14).
export default function DetailsFields({ form, change, errors, venues, conflict, serverConflictMessage }) {
  const extra = extraFieldsFor(form.eventType);
  const venueOptions = [
    ...venues.map((v) => ({ value: v.id, label: `${v.name} (capacity ${v.capacity})`, venue: v })),
    { value: ONLINE, label: 'Online' },
  ];
  const picked = venues.find((v) => v.id === form.venueChoice);

  return (
    <>
      <DateTimeField label="Event Date" mode="date" placeholder="Event Date" value={form.date} onChange={(date) => change({ date })} error={errors.date} testID="field-date" />
      <View style={styles.row}>
        <View style={styles.half}>
          <DateTimeField label="Start time" mode="time" placeholder="Start time" value={form.startTime} onChange={(startTime) => change({ startTime })} error={errors.startTime} testID="field-startTime" />
        </View>
        <View style={styles.half}>
          <DateTimeField label="End time" mode="time" placeholder="End time" value={form.endTime} onChange={(endTime) => change({ endTime })} error={errors.endTime} testID="field-endTime" />
        </View>
      </View>
      <DropdownField
        label="Venue"
        placeholder="Venue"
        value={form.venueChoice}
        options={venueOptions}
        error={errors.venueChoice}
        onChange={(value) =>
          value === ONLINE
            ? change({ venueChoice: ONLINE, venueName: 'Online', venueCapacity: null })
            : change({ venueChoice: value, venueName: picked ? picked.name : venues.find((v) => v.id === value)?.name, venueCapacity: venues.find((v) => v.id === value)?.capacity ?? null })
        }
        testID="field-venue"
      />
      {conflict && conflict.status === 'conflict' ? <ConflictBanner clashingEvent={conflict.clashingEvent} testID="conflict-banner" /> : null}
      {serverConflictMessage ? <ConflictBanner message={serverConflictMessage} testID="conflict-banner-server" /> : null}
      <FormField
        label="Capacity"
        placeholder="Capacity"
        value={String(form.capacity ?? '')}
        onChangeText={(capacity) => change({ capacity: capacity.replace(/[^0-9]/g, '') })}
        keyboardType="number-pad"
        error={errors.capacity}
        hint={form.venueChoice && form.venueChoice !== ONLINE && form.venueCapacity ? `This venue holds up to ${form.venueCapacity} people.` : undefined}
        testID="field-capacity"
      />
      <SwitchRow label="Registration Required?" value={!!form.registrationRequired} onValueChange={(registrationRequired) => change({ registrationRequired })} testID="field-registration" />
      <SwitchRow
        label="Take attendance"
        hint="Certificates for those present"
        value={!!form.attendanceEnabled}
        onValueChange={(attendanceEnabled) => change({ attendanceEnabled })}
        testID="field-attendance"
      />
      {extra === 'speaker' ? (
        <>
          <FormField label="Speaker Name" placeholder="Speaker Name" value={form.speakerName} onChangeText={(speakerName) => change({ speakerName })} error={errors.speakerName} testID="field-speakerName" />
          <FormField label="Speaker designation" placeholder="e.g. Head of Data, Systems Ltd" value={form.speakerDesignation} onChangeText={(speakerDesignation) => change({ speakerDesignation })} error={errors.speakerDesignation} testID="field-speakerDesignation" />
        </>
      ) : null}
      {extra === 'thesis' ? (
        <>
          <FormField label="Presenter name" placeholder="Presenter name" value={form.presenterName} onChangeText={(presenterName) => change({ presenterName })} error={errors.presenterName} testID="field-presenterName" />
          <FormField label="Thesis title" placeholder="Thesis title" value={form.thesisTitle} onChangeText={(thesisTitle) => change({ thesisTitle })} error={errors.thesisTitle} testID="field-thesisTitle" />
          <FormField label="Supervisor name" placeholder="Supervisor name" value={form.supervisorName} onChangeText={(supervisorName) => change({ supervisorName })} error={errors.supervisorName} testID="field-supervisorName" />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
