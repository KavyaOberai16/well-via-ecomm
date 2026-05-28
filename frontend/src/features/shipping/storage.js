// Shared storage key for the customer's last-checked pincode.
// PincodeCheck on the cart and the address form on checkout both read/write
// through this so they stay in sync without prop-drilling.

const STORAGE_KEY = 'lumen.delivery_pincode';

export function readSavedPincode() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSavedPincode(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value || '');
  } catch {
    /* best-effort */
  }
}
