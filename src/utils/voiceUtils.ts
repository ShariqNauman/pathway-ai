
/**
 * Processes audio data for speech-to-text conversion
 */
export const processVoiceRecording = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Use Gemini's API instead of OpenAI
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    
    // Call the API directly
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/whisper-1:transcribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAaEYKy6P3WkHBArYGoxc1s0QW2fm3rTOI"}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      throw new Error('Failed to transcribe audio');
    }
    
    const data = await response.json();
    return data.text || '';
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
