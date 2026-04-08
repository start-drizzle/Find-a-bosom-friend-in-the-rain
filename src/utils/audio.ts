/**
 * Web Audio API utilities for microphone recording and visualization.
 */

export interface AudioController {
  analyser: AnalyserNode;
  mediaStream: MediaStream;
  source: MediaStreamAudioSourceNode;
  audioContext: AudioContext;
  cleanup: () => void;
  startStreaming: (onAudioData: (buffer: ArrayBuffer) => void) => void;
  stopStreaming: () => void;
}

/**
 * Enumerate all available audio input devices (microphones).
 */
export async function enumerateAudioDevices(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'audioinput');
}

/**
 * Create an audio context for microphone input with an analyser node.
 * The analyser can be used to visualize audio levels in real-time.
 * Each controller instance has its own streaming state (not shared).
 */
export async function createAudioContext(
  deviceId?: string,
): Promise<AudioController> {
  let audioProcessingNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  let isStreaming = false;

  const constraints: MediaStreamConstraints = {
    audio: deviceId
      ? { deviceId: { exact: deviceId } }
      : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  };

  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

  const audioContext = new AudioContext();

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.3;

  const source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  const controller: AudioController = {
    analyser,
    mediaStream,
    source,
    audioContext,
    cleanup: () => {
      controller.stopStreaming();
      mediaStream.getTracks().forEach((track) => track.stop());
      source.disconnect();
      audioContext.close();
    },
    startStreaming: (onAudioData) => {
      if (isStreaming) return;
      isStreaming = true;

      const bufferSize = 4096;
      audioProcessingNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

      const TARGET_SAMPLE_RATE = 16000;
      const sourceSampleRate = audioContext.sampleRate;
      const resampleRatio = sourceSampleRate / TARGET_SAMPLE_RATE;

      audioProcessingNode.onaudioprocess = (event) => {
        if (!isStreaming) return;

        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);

        const outputLength = Math.floor(inputData.length / resampleRatio);
        const resampledData = new Float32Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
          const srcIndex = i * resampleRatio;
          const srcIndexFloor = Math.floor(srcIndex);
          const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
          const frac = srcIndex - srcIndexFloor;
          resampledData[i] = inputData[srcIndexFloor] * (1 - frac) + inputData[srcIndexCeil] * frac;
        }

        const pcmBuffer = new ArrayBuffer(resampledData.length * 2);
        const pcmView = new DataView(pcmBuffer);
        for (let i = 0; i < resampledData.length; i++) {
          const sample = Math.max(-1, Math.min(1, resampledData[i]));
          pcmView.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        }

        onAudioData(pcmBuffer);
      };

      // Route through a silent gain node so ScriptProcessor fires onaudioprocess
      // without playing microphone audio through the speakers (prevents echo).
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;

      analyser.connect(audioProcessingNode);
      audioProcessingNode.connect(silentGain);
      silentGain.connect(audioContext.destination);
    },
    stopStreaming: () => {
      if (!isStreaming) return;
      isStreaming = false;

      if (audioProcessingNode) {
        audioProcessingNode.disconnect();
        audioProcessingNode = null;
      }
    },
  };

  return controller;
}
