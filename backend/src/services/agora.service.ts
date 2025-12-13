import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const AGORA_APP_ID = process.env.AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// Token expiry time (1 hour)
const TOKEN_EXPIRY_TIME = 3600;

export interface AgoraToken {
  channelName: string;
  token: string;
  uid: number;
  appId: string;
}

/**
 * Generate Agora RTC token for video consultation
 * @param channelName - Unique channel name (typically consultation ID)
 * @param uid - User ID (0 for auto-assign)
 * @param role - User role (publisher or subscriber)
 */
export const generateAgoraToken = (
  channelName: string,
  uid: number = 0,
  role: 'publisher' | 'subscriber' = 'publisher'
): AgoraToken => {
  // If no app certificate is set, return unsigned token (for testing)
  if (!AGORA_APP_CERTIFICATE) {
    console.warn('⚠️  AGORA_APP_CERTIFICATE not set. Using testing mode.');
    return {
      channelName,
      token: '',
      uid,
      appId: AGORA_APP_ID,
    };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRY_TIME;

  const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // Generate RTC token
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    rtcRole,
    privilegeExpiredTs
  );

  return {
    channelName,
    token,
    uid,
    appId: AGORA_APP_ID,
  };
};

/**
 * Generate tokens for both doctor and patient
 * @param consultationId - Unique consultation ID used as channel name
 */
export const generateConsultationTokens = (consultationId: string) => {
  // Generate unique UIDs for doctor and patient
  const doctorUid = Math.floor(Math.random() * 1000000) + 1000000; // 1000000-1999999
  const patientUid = Math.floor(Math.random() * 1000000) + 2000000; // 2000000-2999999

  const doctorToken = generateAgoraToken(consultationId, doctorUid, 'publisher');
  const patientToken = generateAgoraToken(consultationId, patientUid, 'publisher');

  return {
    channelName: consultationId,
    appId: AGORA_APP_ID,
    doctor: {
      token: doctorToken.token,
      uid: doctorUid,
    },
    patient: {
      token: patientToken.token,
      uid: patientUid,
    },
  };
};
