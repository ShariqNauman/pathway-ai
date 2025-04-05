
/**
 * Processes audio data for speech-to-text conversion using Web Speech API
 */
export const processVoiceRecording = async (audioBlob: Blob): Promise<string> => {
  try {
    // For mobile compatibility, we use a more reliable approach
    // We'll play the audio and use the Web Speech API to transcribe it
    return new Promise((resolve, reject) => {
      // Create a temporary audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // Create a SpeechRecognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        // Return a friendly message for browsers that don't support speech recognition
        console.log("Speech recognition not supported by this browser");
        resolve("Speech recognition not available in this browser. Please type your message instead.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = true; // Better for longer audio clips
      
      let finalTranscript = '';
      
      // When we get results, accumulate them
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };
      
      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        // Don't reject immediately, try alternate method
        if (finalTranscript) {
          resolve(finalTranscript.trim());
        } else {
          reject(new Error(`Speech recognition error: ${event.error}`));
        }
      };
      
      // When recognition ends, resolve with the transcript
      recognition.onend = () => {
        if (finalTranscript) {
          resolve(finalTranscript.trim());
        } else {
          // Try an alternative approach for mobile
          resolve(mobileAudioFallback(audioBlob));
        }
      };
      
      // Play the audio and start recognition
      audio.oncanplaythrough = () => {
        try {
          // Start recognition before playing to catch all audio
          recognition.start();
          setTimeout(() => {
            audio.play().catch(err => {
              console.error("Error playing audio:", err);
            });
          }, 500);
        } catch (error) {
          console.error('Error starting recognition:', error);
          reject(error);
        }
      };
      
      // Set a timeout in case recognition doesn't complete
      setTimeout(() => {
        try {
          recognition.stop();
          if (!finalTranscript) {
            resolve(mobileAudioFallback(audioBlob));
          }
        } catch (e) {
          // Ignore errors on stopping
        }
      }, 12000); // 12 seconds timeout
    });
  } catch (error) {
    console.error('Error processing voice recording:', error);
    throw error;
  }
};

// Alternate approach for mobile devices where direct recognition might fail
const mobileAudioFallback = async (audioBlob: Blob): Promise<string> => {
  // Create a new recognition instance specifically for mobile
  return new Promise((resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      resolve("Please type your message instead.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;
    
    // Try with different settings optimized for mobile
    try {
      recognition.start();
      
      let hasResult = false;
      recognition.onresult = (event) => {
        hasResult = true;
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        resolve(transcript);
        try { recognition.stop(); } catch(e) {}
      };
      
      // Auto-stop after 8 seconds to avoid hanging
      setTimeout(() => {
        if (!hasResult) {
          try { recognition.stop(); } catch(e) {}
          resolve(""); // Return empty if we couldn't get a good result
        }
      }, 8000);
      
      recognition.onerror = () => {
        try { recognition.stop(); } catch(e) {}
        resolve("Please tap the microphone and speak clearly.");
      };
      
    } catch (error) {
      console.error("Mobile fallback error:", error);
      resolve("Voice recognition unavailable. Please type your message.");
    }
  });
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
 * Utility for browser-based voice recording with better mobile support
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: BlobPart[] = [];
  
  async start(): Promise<void> {
    try {
      this.audioChunks = [];
      
      // Request with constraints optimized for speech
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific constraints
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      // Use appropriate mime type based on browser support
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, { 
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // Lower bitrate for better transmission
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      // Request data every 1 second (better for mobile)
      this.mediaRecorder.start(1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }
  
  // Get supported mime type for best compatibility
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
      ''  // Empty string as fallback (browser default)
    ];
    
    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return '';
  }
  
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        // Determine the mime type (important for mobile compatibility)
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
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
