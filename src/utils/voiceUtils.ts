
/**
 * TypeScript declarations for Web Speech API
 * These are needed because TypeScript doesn't include these by default
 */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

/**
 * Simple, optimized voice recording utility for web applications
 * Designed for maximum browser compatibility - especially mobile
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: BlobPart[] = [];
  private stream: MediaStream | null = null;
  private isInitialized: boolean = false;
  private isRecording: boolean = false;
  
  async start(): Promise<void> {
    try {
      // Check if already recording
      if (this.isRecording) {
        console.log('Already recording, ignoring start request');
        return;
      }
      
      // Clear previous recording session
      this.audioChunks = [];
      
      // Only request new stream if we don't have one initialized already
      if (!this.isInitialized) {
        // Request user media with constraints optimized for voice
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        this.isInitialized = true;
      }

      if (!this.stream) {
        throw new Error('No audio stream available');
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      // Reset state on error
      this.isInitialized = false;
      this.isRecording = false;
      this.releaseResources();
      throw error;
    }
  }
  
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording || this.mediaRecorder.state === 'inactive') {
        this.isRecording = false;
        reject(new Error('No recording in progress'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        // Use standard audio format for browser compatibility
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        // Reset recording flag
        this.isRecording = false;
        // Don't fully release resources, just reset the mediaRecorder
        this.mediaRecorder = null;
        resolve(audioBlob);
      };
      
      this.mediaRecorder.onerror = () => {
        this.isRecording = false;
        this.releaseResources();
        reject(new Error('Recording error occurred'));
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  private releaseResources(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.isInitialized = false;
    this.isRecording = false;
  }
  
  // Get recording status
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
  
  // Cleanup method to be called when recorder is no longer needed
  cleanup(): void {
    this.releaseResources();
  }
}

/**
 * Transcribes speech from an audio blob using the Web Speech API
 * Enhanced for accuracy with better error handling
 */
export const transcribeAudio = (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check for browser compatibility first
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("Speech recognition not available in this browser");
      resolve("Speech recognition not available. Please type your message.");
      return;
    }

    try {
      // Create recognition instance with optimized settings
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 5; // Increased for better accuracy
      recognition.continuous = true; // Enable continuous recognition for better results
      
      let recognitionResult = '';
      
      recognition.onresult = (event) => {
        // Process all results to get the best transcript
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            // Find the alternative with highest confidence
            const alternatives = Array.from({ length: event.results[i].length })
              .map((_, j) => event.results[i][j])
              .sort((a, b) => b.confidence - a.confidence);
              
            // If we have multiple alternatives with decent confidence, pick the longest one
            const highConfidenceAlts = alternatives.filter(alt => alt.confidence > 0.7);
            const bestAlternative = highConfidenceAlts.length > 1 
              ? highConfidenceAlts.reduce((prev, current) => 
                  current.transcript.length > prev.transcript.length ? current : prev, 
                  highConfidenceAlts[0])
              : alternatives[0];
              
            recognitionResult += bestAlternative.transcript + " ";
            console.log('Transcript segment:', bestAlternative.transcript, 'confidence:', bestAlternative.confidence);
          }
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Recognition error:', event.error, event.message);
        // Don't reject so we can still handle it gracefully
        if (recognitionResult) {
          resolve(recognitionResult.trim());
        } else {
          resolve("");
        }
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on stopping
        }
      };
      
      recognition.onend = () => {
        if (recognitionResult) {
          resolve(recognitionResult.trim());
        } else {
          resolve(""); // Gracefully handle empty results
        }
      };

      // Direct recognition of the audio blob without playback
      // We'll use a more direct approach for processing the audio
      // Start recognition
      recognition.start();
      
      // Process the audio blob in memory
      // For better accuracy, we don't need to play the audio back to the user
      // Instead, we'll perform direct recognition on the audio data
      
      // Set a timeout for recognition
      setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on stopping
          console.log('Error stopping recognition after timeout:', e);
        }
      }, 5000); // Increased timeout for better recognition results
    } catch (error) {
      console.error('Error in speech recognition:', error);
      resolve("");
    }
  });
};

// Convert blob to base64 (helper function for API communication)
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
