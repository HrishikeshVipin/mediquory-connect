import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM mode
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

// Get encryption key from environment variable
// In production, this should be a strong, randomly generated key stored securely
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    console.error('⚠️  WARNING: ENCRYPTION_KEY not set in environment variables!');
    console.error('⚠️  Using fallback key. THIS IS INSECURE FOR PRODUCTION!');
    // Fallback for development - NEVER use in production
    return 'dev-fallback-key-change-in-production-32chars-long!!';
  }

  // Ensure key is exactly 32 bytes (256 bits) for AES-256
  return crypto.createHash('sha256').update(key).digest('base64').substring(0, 32);
};

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export const encrypt = (plaintext: string): string => {
  if (!plaintext) return '';

  try {
    const key = getEncryptionKey();

    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (for GCM mode)
    const authTag = cipher.getAuthTag();

    // Return in format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error: any) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data encrypted with the encrypt function
 * @param encryptedData - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plaintext
 */
export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return '';

  try {
    const key = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way, for comparison only)
 * Useful for data that doesn't need to be decrypted (like Aadhaar for verification)
 * @param data - The data to hash
 * @returns Hashed string
 */
export const hash = (data: string): string => {
  if (!data) return '';

  try {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hashedData = crypto.pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha512').toString('hex');
    return `${salt}:${hashedData}`;
  } catch (error: any) {
    console.error('Hashing error:', error.message);
    throw new Error('Failed to hash data');
  }
};

/**
 * Verify hashed data
 * @param data - Plain data to verify
 * @param hashedData - Hashed data in format: salt:hash
 * @returns true if data matches hash
 */
export const verifyHash = (data: string, hashedData: string): boolean => {
  if (!data || !hashedData) return false;

  try {
    const [salt, originalHash] = hashedData.split(':');
    const hash = crypto.pbkdf2Sync(data, salt, 100000, KEY_LENGTH, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (error: any) {
    console.error('Hash verification error:', error.message);
    return false;
  }
};

/**
 * Mask sensitive data for display (e.g., Aadhaar number)
 * @param data - The data to mask
 * @param visibleChars - Number of characters to show at the end
 * @returns Masked string (e.g., "XXXX-XXXX-1234")
 */
export const maskData = (data: string, visibleChars: number = 4): string => {
  if (!data) return '';

  const dataStr = data.toString();
  if (dataStr.length <= visibleChars) return dataStr;

  const masked = 'X'.repeat(dataStr.length - visibleChars);
  const visible = dataStr.slice(-visibleChars);

  return `${masked}${visible}`;
};

/**
 * Mask Aadhaar number in standard format
 * @param aadhaar - 12-digit Aadhaar number
 * @returns Masked Aadhaar (e.g., "XXXX-XXXX-1234")
 */
export const maskAadhaar = (aadhaar: string): string => {
  if (!aadhaar) return '';

  const cleaned = aadhaar.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length !== 12) return maskData(aadhaar, 4);

  const masked = `XXXX-XXXX-${cleaned.slice(-4)}`;
  return masked;
};

/**
 * Mask phone number
 * @param phone - Phone number
 * @returns Masked phone (e.g., "XXXXXX1234")
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length < 4) return phone;

  return maskData(cleaned, 4);
};
