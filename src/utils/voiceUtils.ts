
/**
 * TypeScript declarations for Web Speech API
 * These are needed because TypeScript doesn't include these by default
 */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
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

  async start(): Promise<void> {
    try {
      this.audioChunks = [];
      // Request user media with constraints optimized for voice
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Use standard audio format for browser compatibility
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.releaseResources();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
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
  }
}

/**
 * Transcribes speech from an audio blob using the Web Speech API
 */
export const transcribeAudio = (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an audio element and set the blob as source
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(audioBlob);
    
    // Function to handle recognition results
    const performRecognition = () => {
      // Check for browser compatibility
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        resolve("Speech recognition not available. Please type your message.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let recognitionResult = '';
      
      recognition.onresult = (event) => {
        recognitionResult = event.results[0][0].transcript;
      };
      
      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        resolve(""); // Return empty string to gracefully handle the error
      };
      
      recognition.onend = () => {
        if (recognitionResult) {
          resolve(recognitionResult);
        } else {
          resolve(""); // Gracefully handle empty results
        }
      };

      try {
        recognition.start();
        
        // Play the audio to help with recognition
        audioElement.play().catch(e => console.error('Error playing audio:', e));
        
        // Set a timeout to ensure recognition ends
        setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {
            // Ignore errors on stopping
          }
        }, 10000);
      } catch (error) {
        console.error('Error in speech recognition:', error);
        resolve("");
      }
    };

    audioElement.oncanplaythrough = performRecognition;
    audioElement.onerror = () => resolve("");
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
