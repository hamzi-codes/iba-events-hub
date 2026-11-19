import React from 'react';

import DropdownField from '../DropdownField';
import FormField from '../FormField';

// Organisation (only when the user is linked to several), event type, title, description.
// Used on screen 10 and inside the Edit form (screen 14).
export default function BasicsFields({ form, change, errors, organisations, eventTypes, lockOrganisation }) {
  const showOrganisation = organisations.length > 1 || lockOrganisation;
  return (
    <>
      {showOrganisation ? (
        <DropdownField
          label="Organisation / Society Name"
          placeholder="Choose an organisation"
          value={form.organisationId}
          options={organisations.map((o) => ({ value: o.id, label: o.name }))}
          disabled={lockOrganisation}
          error={errors.organisationId}
          onChange={(value, option) => {
            const organisation = organisations.find((o) => o.id === value);
            change({ organisationId: value, organisationName: option.label, category: organisation.category, eventType: '' });
          }}
          testID="field-organisation"
        />
      ) : null}
      <DropdownField
        label="Event type"
        placeholder={form.organisationId ? 'Choose an event type' : 'Choose an organisation first'}
        value={form.eventType}
        options={eventTypes.map((type) => ({ value: type, label: type }))}
        disabled={!form.organisationId}
        error={errors.eventType}
        onChange={(value) => change({ eventType: value })}
        testID="field-eventType"
      />
      <FormField
        label="Title"
        placeholder="Title"
        value={form.title}
        onChangeText={(title) => change({ title })}
        error={errors.title}
        maxLength={120}
        testID="field-title"
      />
      <FormField
        label="Description"
        placeholder="Description"
        value={form.description}
        onChangeText={(description) => change({ description })}
        error={errors.description}
        multiline
        numberOfLines={5}
        style={{ minHeight: 110 }}
        testID="field-description"
      />
    </>
  );
}
