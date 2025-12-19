import { encrypt, decrypt, maskAadhaar, maskPhone } from '../utils/encryption';

/**
 * Fields that should be encrypted in the Doctor model
 */
const ENCRYPTED_DOCTOR_FIELDS = ['aadhaarNumber', 'phone', 'upiId'];

/**
 * Fields that should be encrypted in the Patient model
 */
const ENCRYPTED_PATIENT_FIELDS = ['phone'];

/**
 * Encrypt sensitive fields in doctor data before saving to database
 * @param doctorData - Doctor data object
 * @returns Doctor data with encrypted fields
 */
export const encryptDoctorData = (doctorData: any): any => {
  if (!doctorData) return doctorData;

  const encrypted = { ...doctorData };

  // Encrypt Aadhaar number if present
  if (encrypted.aadhaarNumber) {
    encrypted.aadhaarNumber = encrypt(encrypted.aadhaarNumber);
  }

  // Encrypt phone number if present
  if (encrypted.phone) {
    encrypted.phone = encrypt(encrypted.phone);
  }

  // Encrypt UPI ID if present
  if (encrypted.upiId) {
    encrypted.upiId = encrypt(encrypted.upiId);
  }

  return encrypted;
};

/**
 * Decrypt sensitive fields in doctor data after retrieving from database
 * @param doctorData - Doctor data object with encrypted fields
 * @param maskSensitive - If true, mask sensitive data instead of fully decrypting
 * @returns Doctor data with decrypted/masked fields
 */
export const decryptDoctorData = (doctorData: any, maskSensitive: boolean = false): any => {
  if (!doctorData) return doctorData;

  const decrypted = { ...doctorData };

  try {
    // Decrypt/Mask Aadhaar number
    if (decrypted.aadhaarNumber) {
      const decryptedAadhaar = decrypt(decrypted.aadhaarNumber);
      decrypted.aadhaarNumber = maskSensitive ? maskAadhaar(decryptedAadhaar) : decryptedAadhaar;
      // Also provide masked version separately
      if (!maskSensitive) {
        decrypted.aadhaarNumberMasked = maskAadhaar(decryptedAadhaar);
      }
    }

    // Decrypt/Mask phone number
    if (decrypted.phone) {
      const decryptedPhone = decrypt(decrypted.phone);
      decrypted.phone = maskSensitive ? maskPhone(decryptedPhone) : decryptedPhone;
      // Also provide masked version separately
      if (!maskSensitive) {
        decrypted.phoneMasked = maskPhone(decryptedPhone);
      }
    }

    // Decrypt UPI ID (fully decrypt, no masking)
    if (decrypted.upiId) {
      decrypted.upiId = decrypt(decrypted.upiId);
    }
  } catch (error: any) {
    console.error('Error decrypting doctor data:', error.message);
    // On decryption error, mask the fields to avoid exposing encrypted data
    if (decrypted.aadhaarNumber) decrypted.aadhaarNumber = '************';
    if (decrypted.phone) decrypted.phone = '**********';
    if (decrypted.upiId) decrypted.upiId = '**********';
  }

  return decrypted;
};

/**
 * Encrypt sensitive fields in patient data before saving to database
 * @param patientData - Patient data object
 * @returns Patient data with encrypted fields
 */
export const encryptPatientData = (patientData: any): any => {
  if (!patientData) return patientData;

  const encrypted = { ...patientData };

  // Encrypt phone number if present
  if (encrypted.phone) {
    encrypted.phone = encrypt(encrypted.phone);
  }

  return encrypted;
};

/**
 * Decrypt sensitive fields in patient data after retrieving from database
 * @param patientData - Patient data object with encrypted fields
 * @param maskSensitive - If true, mask sensitive data instead of fully decrypting
 * @returns Patient data with decrypted/masked fields
 */
export const decryptPatientData = (patientData: any, maskSensitive: boolean = false): any => {
  if (!patientData) return patientData;

  const decrypted = { ...patientData };

  try {
    // Decrypt/Mask phone number
    if (decrypted.phone) {
      const decryptedPhone = decrypt(decrypted.phone);
      decrypted.phone = maskSensitive ? maskPhone(decryptedPhone) : decryptedPhone;
      // Also provide masked version separately
      if (!maskSensitive) {
        decrypted.phoneMasked = maskPhone(decryptedPhone);
      }
    }
  } catch (error: any) {
    console.error('Error decrypting patient data:', error.message);
    // On decryption error, mask the field
    if (decrypted.phone) decrypted.phone = '**********';
  }

  return decrypted;
};

/**
 * Decrypt an array of doctor records
 * @param doctors - Array of doctor objects
 * @param maskSensitive - If true, mask sensitive data
 * @returns Array of doctors with decrypted/masked fields
 */
export const decryptDoctorArray = (doctors: any[], maskSensitive: boolean = true): any[] => {
  if (!Array.isArray(doctors)) return doctors;
  return doctors.map(doctor => decryptDoctorData(doctor, maskSensitive));
};

/**
 * Decrypt an array of patient records
 * @param patients - Array of patient objects
 * @param maskSensitive - If true, mask sensitive data
 * @returns Array of patients with decrypted/masked fields
 */
export const decryptPatientArray = (patients: any[], maskSensitive: boolean = true): any[] => {
  if (!Array.isArray(patients)) return patients;
  return patients.map(patient => decryptPatientData(patient, maskSensitive));
};
