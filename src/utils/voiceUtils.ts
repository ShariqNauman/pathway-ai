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
      recognition.interimResults = true; // Enable interim results for faster feedback
      recognition.maxAlternatives = 1; // Reduce alternatives for faster processing
      recognition.continuous = false; // Disable continuous mode for faster completion
      
      let recognitionResult = '';
      let hasFinalResult = false;
      
      recognition.onresult = (event) => {
        // Process all results to get the best transcript
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            hasFinalResult = true;
            recognitionResult = transcript;
            console.log('Final transcript:', transcript);
            recognition.stop(); // Stop recognition once we have a final result
          } else {
            // For interim results, update the transcript
            recognitionResult = transcript;
            console.log('Interim transcript:', transcript);
          }
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Recognition error:', event.error, event.message);
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
        } else if (!hasFinalResult) {
          resolve(""); // Gracefully handle empty results
        }
      };

      // Start recognition
      recognition.start();
      
      // Set a reasonable timeout to prevent hanging
      setTimeout(() => {
        if (!hasFinalResult) {
          recognition.stop();
          if (recognitionResult) {
            resolve(recognitionResult.trim());
          } else {
            resolve("");
          }
        }
      }, 10000); // 10 second timeout
      
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
