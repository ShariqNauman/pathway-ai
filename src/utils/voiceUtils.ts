
/**
 * Processes audio data for speech-to-text conversion using a free API
 */
export const processVoiceRecording = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert audio to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Use free Web Speech API for transcription
    return new Promise((resolve, reject) => {
      // Create a temporary audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // Create a SpeechRecognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        // Fallback method if browser doesn't support Web Speech API
        console.log("Speech recognition not supported, using simple detection");
        resolve("Speech recognition not available in this browser. Please type your message instead.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      // When we get a result, resolve the promise with the transcript
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      
      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      // Play the audio and start recognition
      audio.oncanplaythrough = () => {
        try {
          recognition.start();
          audio.play();
        } catch (error) {
          console.error('Error starting recognition:', error);
          reject(error);
        }
      };
      
      // Set a timeout in case recognition doesn't complete
      setTimeout(() => {
        try {
          recognition.stop();
          resolve(""); // Return empty if timeout
        } catch (e) {
          // Ignore errors on stopping
        }
      }, 10000); // 10 seconds timeout
    });
  } catch (error) {
    console.error('Error processing voice recording:', error);
    throw error;
  }
};

/**
 * Converts a Blob to base64 format
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Utility for browser-based voice recording
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: BlobPart[] = [];
  
  async start(): Promise<void> {
    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }
  
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(audioBlob);
      };
      
      this.mediaRecorder.addEventListener('error', (event) => {
        this.cleanup();
        reject(new Error('Recording error occurred'));
      });
      
      this.mediaRecorder.stop();
    });
  }
  
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}

// Add TypeScript declarations for Web Speech API if needed
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
