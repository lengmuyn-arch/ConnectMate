import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseDeviceVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  volume: number; // 0 to 100
  frequencies: number[]; // 16 frequency bands
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  hasSpeechSupport: boolean;
}

export const useDeviceVoiceInput = (): UseDeviceVoiceInputReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>(Array(16).fill(5));
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const hasSpeechSupport = typeof window !== 'undefined' && 
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    // 1. Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // 2. Stop audio visualizer
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 3. Stop audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 4. Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsListening(false);
    setVolume(0);
    setFrequencies(Array(16).fill(5));
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setInterimTranscript('');

    try {
      // 1. Request real microphone access for live visualizer & volume
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Realtime audio visualizer loop
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const renderVisualizer = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);

        let sum = 0;
        const bands: number[] = [];
        const step = Math.max(1, Math.floor(buffer.length / 16));

        for (let i = 0; i < 16; i++) {
          const val = buffer[i * step] || 0;
          bands.push(Math.round((val / 255) * 100));
          sum += val;
        }

        const avg = sum / buffer.length;
        const normVol = Math.min(100, Math.round((avg / 128) * 100));
        setVolume(normVol);
        setFrequencies(bands);

        animFrameRef.current = requestAnimationFrame(renderVisualizer);
      };
      renderVisualizer();

      // 2. Initialize Speech Recognition if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              currentFinal += res[0].transcript + ' ';
            } else {
              currentInterim += res[0].transcript;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Bạn đã chặn quyền truy cập Micro trên trình duyệt.');
          }
        };

        recognition.onend = () => {
          // If still intended to listen, we let the visualizer stay or clean up
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsListening(true);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setError('Không thể mở Micro của thiết bị. Vui lòng cấp quyền Micro trong cài đặt trình duyệt.');
      stopListening();
    }
  }, [stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    volume,
    frequencies,
    error,
    startListening,
    stopListening,
    clearTranscript,
    hasSpeechSupport,
  };
};
