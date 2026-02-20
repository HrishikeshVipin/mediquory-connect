'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';

interface VideoRoomProps {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  userType: 'doctor' | 'patient';
  userName: string;
  onLeave?: () => void;
}

export default function VideoRoom({
  appId,
  channel,
  token,
  uid,
  userType,
  userName,
  onLeave,
}: VideoRoomProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string>('');
  const [remoteLeftMessage, setRemoteLeftMessage] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});
  // Keep latest onLeave ref so event handlers always call the current callback
  const onLeaveRef = useRef(onLeave);
  useEffect(() => { onLeaveRef.current = onLeave; });

  // Shared cleanup — safe to call from event handlers or handleLeave
  const cleanup = async () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (clientRef.current) {
      try { await clientRef.current.leave(); } catch (_) {}
      clientRef.current = null;
    }
  };

  // Initialize Agora client
  useEffect(() => {
    let isActive = true;

    const init = async () => {
      try {
        // Dynamically import AgoraRTC (client-side only)
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        if (!isActive) {
          await client.leave();
          return;
        }

        clientRef.current = client;

        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              const exists = prev.find((u) => u.uid === user.uid);
              if (exists) return prev;
              return [...prev, user];
            });
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });

        // Auto-end call when the remote user leaves
        client.on('user-left', (user) => {
          console.log('Remote user left:', user.uid);
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));

          const otherParty = userType === 'doctor' ? 'Patient' : 'Doctor';
          setRemoteLeftMessage(`${otherParty} has ended the call.`);

          // Give 2 seconds to show the message, then auto-end
          setTimeout(async () => {
            if (!isActive) return;
            await cleanup();
            setIsJoined(false);
            if (onLeaveRef.current) onLeaveRef.current();
          }, 2000);
        });

        // Join the channel
        await client.join(appId, channel, token, uid);

        // Get available cameras
        const devices = await AgoraRTC.getCameras();
        setCameras(devices);

        // Try to create video track — fall back to audio-only if no camera
        let videoTrack: ICameraVideoTrack | null = null;
        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: '720p_3' });
          setCurrentCameraId(videoTrack.getTrackLabel());
          localVideoTrackRef.current = videoTrack;
        } catch (cameraErr: any) {
          const isNoCamera =
            cameraErr.code === 'DEVICE_NOT_FOUND' ||
            cameraErr.name === 'NotFoundError' ||
            cameraErr.message?.toLowerCase().includes('device not found') ||
            cameraErr.message?.toLowerCase().includes('notfounderror');

          if (isNoCamera) {
            console.warn('No camera found — joining audio-only');
            setIsVideoOn(false);
          } else {
            throw cameraErr; // unexpected camera error — surface it
          }
        }

        // Create audio track
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;

        // Play local video if we have a camera
        if (videoTrack && localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publish available tracks
        const tracksToPublish = [
          ...(videoTrack ? [videoTrack] : []),
          audioTrack,
        ];
        await client.publish(tracksToPublish);

        setIsJoined(true);
      } catch (err: any) {
        console.error('Error initializing video call:', err);

        // User-friendly error messages
        if (
          err.name === 'NotAllowedError' ||
          err.message?.toLowerCase().includes('permission')
        ) {
          setError('Camera/microphone permission denied. Please allow access in your browser settings and retry.');
        } else if (
          err.code === 'DEVICE_NOT_FOUND' ||
          err.name === 'NotFoundError'
        ) {
          setError('No microphone found. Please connect a microphone and retry.');
        } else {
          setError(`Failed to join video call: ${err.message}`);
        }
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isActive = false;
      cleanup();
    };
  }, [appId, channel, token, uid]);

  // Play remote videos
  useEffect(() => {
    remoteUsers.forEach((user) => {
      const ref = remoteVideoRefs.current[user.uid.toString()];
      if (ref && user.videoTrack) {
        user.videoTrack.play(ref);
      }
    });
  }, [remoteUsers]);

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const switchCamera = async () => {
    if (!localVideoTrackRef.current || cameras.length <= 1) return;

    try {
      const currentLabel = localVideoTrackRef.current.getTrackLabel();
      const currentIndex = cameras.findIndex(cam => cam.label === currentLabel);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      await localVideoTrackRef.current.setDevice(nextCamera.deviceId);
      setCurrentCameraId(nextCamera.label);
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Failed to switch camera. Please try again.');
    }
  };

  const handleLeave = async () => {
    try {
      await cleanup();
      setIsJoined(false);
      if (onLeave) onLeave();
    } catch (err) {
      console.error('Error leaving video call:', err);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">Video Call Error</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Grid */}
      <div className="relative min-h-[500px]">
        {/* Remote left banner */}
        {remoteLeftMessage && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center text-white">
              <div className="text-5xl mb-4">📵</div>
              <p className="text-xl font-semibold">{remoteLeftMessage}</p>
              <p className="text-sm text-gray-400 mt-2">Ending call...</p>
            </div>
          </div>
        )}

        {/* Remote Videos */}
        {remoteUsers.length > 0 ? (
          <div className={`grid ${remoteUsers.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 h-full`}>
            {remoteUsers.map((user) => (
              <div key={user.uid} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <div
                  ref={(el) => {
                    remoteVideoRefs.current[user.uid.toString()] = el;
                  }}
                  className="w-full h-full min-h-[400px]"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1 rounded text-white text-sm">
                  {userType === 'doctor' ? 'Patient' : 'Doctor'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              {!isJoined ? (
                <p className="text-lg">Connecting...</p>
              ) : (
                <>
                  <p className="text-lg">Waiting for {userType === 'doctor' ? 'patient' : 'doctor'} to join...</p>
                  {!isVideoOn && (
                    <p className="text-sm text-yellow-400 mt-2">No camera detected — audio only</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
          {isVideoOn ? (
            <div ref={localVideoRef} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-2xl">🎤</div>
                <p className="text-xs mt-1">Audio only</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
            You ({userName})
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={toggleAudio}
          className={`p-3 sm:p-4 rounded-full transition-colors ${
            isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleVideo}
          disabled={!localVideoTrackRef.current}
          className={`p-3 sm:p-4 rounded-full transition-colors ${
            !localVideoTrackRef.current
              ? 'bg-gray-600 opacity-50 cursor-not-allowed'
              : isVideoOn
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
          }`}
          title={!localVideoTrackRef.current ? 'No camera' : isVideoOn ? 'Stop Video' : 'Start Video'}
        >
          {isVideoOn ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        {/* Camera Switch Button - Only show if multiple cameras available */}
        {cameras.length > 1 && localVideoTrackRef.current && (
          <button
            onClick={switchCamera}
            className="p-3 sm:p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
            title="Switch Camera (Front/Back)"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

        <button
          onClick={handleLeave}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold text-sm sm:text-base"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
