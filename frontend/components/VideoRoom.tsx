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

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<{ [uid: string]: HTMLDivElement | null }>({});

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
          console.log('User published:', user.uid, mediaType);

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
          console.log('User unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          }
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        // Join the channel
        await client.join(appId, channel, token, uid);
        console.log('✅ Joined channel:', channel, 'as UID:', uid, 'Role:', userType);

        // Get available cameras
        const devices = await AgoraRTC.getCameras();
        console.log('📹 Available cameras:', devices);
        setCameras(devices);

        // Create video track with explicit configuration
        console.log('🎥 Creating camera video track...');
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_3', // 1280x720, 30fps
        });
        console.log('✅ Video track created:', videoTrack.getTrackId());

        // Get current camera device
        const currentDevice = videoTrack.getTrackLabel();
        setCurrentCameraId(currentDevice);
        console.log('📸 Using camera:', currentDevice);

        // Create audio track
        console.log('🎤 Creating microphone audio track...');
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log('✅ Audio track created:', audioTrack.getTrackId());

        localVideoTrackRef.current = videoTrack;
        localAudioTrackRef.current = audioTrack;

        // Play local video
        if (localVideoRef.current) {
          console.log('▶️ Playing local video in container...');
          videoTrack.play(localVideoRef.current);
          console.log('✅ Local video playing');
        } else {
          console.error('❌ Local video ref not available');
        }

        // Publish tracks
        console.log('📡 Publishing local tracks to channel...');
        await client.publish([videoTrack, audioTrack]);
        console.log('✅ Published video and audio tracks successfully');
        console.log('📊 Track states - Video enabled:', videoTrack.enabled, 'Audio enabled:', audioTrack.enabled);

        setIsJoined(true);
      } catch (err: any) {
        console.error('Error initializing video call:', err);
        setError(`Failed to join video call: ${err.message}`);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isActive = false;
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
          await clientRef.current.leave();
          clientRef.current = null;
        }
      };
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
      console.log('🔄 Switching camera...');

      // Get current camera index
      const currentLabel = localVideoTrackRef.current.getTrackLabel();
      const currentIndex = cameras.findIndex(cam => cam.label === currentLabel);

      // Get next camera (loop back to first if at end)
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      console.log('📸 Switching from:', currentLabel, 'to:', nextCamera.label);

      // Switch to the next camera
      await localVideoTrackRef.current.setDevice(nextCamera.deviceId);
      setCurrentCameraId(nextCamera.label);

      console.log('✅ Camera switched successfully to:', nextCamera.label);
    } catch (error) {
      console.error('❌ Error switching camera:', error);
      alert('Failed to switch camera. Please try again.');
    }
  };

  const handleLeave = async () => {
    try {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
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
              <p className="text-lg">Waiting for {userType === 'doctor' ? 'patient' : 'doctor'} to join...</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
          <div ref={localVideoRef} className="w-full h-full" />
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
          className={`p-3 sm:p-4 rounded-full transition-colors ${
            isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          }`}
          title={isVideoOn ? 'Stop Video' : 'Start Video'}
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
        {cameras.length > 1 && (
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
