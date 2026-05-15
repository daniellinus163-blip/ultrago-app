/**
 * Profile photo pick/upload is only allowed after required profile fields are entered.
 */
export type ProfileEntryBasics = {
  displayName?: string;
  phone?: string;
  hasLocation?: boolean;
};

export function hasEnteredProfileBasics(fields: ProfileEntryBasics): boolean {
  return (
    Boolean(fields.displayName?.trim()) &&
    (fields.phone?.trim().length ?? 0) >= 8 &&
    Boolean(fields.hasLocation)
  );
}

export const PROFILE_PHOTO_LOCKED_MESSAGE =
  'Enter your name, phone number, and save live location before adding a profile photo.';
