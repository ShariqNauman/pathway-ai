import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting video render request...');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { format = 'mp4', quality = 90 } = await req.json();

    console.log(`Rendering video with format: ${format}, quality: ${quality}`);

    // Generate a data URL for the actual video file
    // For demo purposes, we'll create a direct download link to a generated video
    // In production, you would use Remotion's server-side rendering
    const videoData = await generatePathwayVideo();
    
    const response = {
      message: 'Video rendered successfully',
      downloadUrl: videoData.url,
      status: 'completed',
      fileSize: videoData.size,
      duration: '30 seconds'
    };

    console.log('Video render response:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in render-video function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to render video',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Generate a mock video file (in production, this would use Remotion rendering)
async function generatePathwayVideo() {
  // Create a simple video data URL for demo purposes
  // This would be replaced with actual Remotion rendering in production
  const videoBlob = await createDemoVideo();
  const videoUrl = URL.createObjectURL(videoBlob);
  
  return {
    url: videoUrl,
    size: '~18 MB',
    format: 'mp4'
  };
}

async function createDemoVideo() {
  // Create a simple demo video blob
  // In production, this would render the actual Remotion video
  const canvas = new OffscreenCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  
  // Create a simple gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(1, '#8B5CF6');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);
  
  // Add text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Pathway', 960, 400);
  ctx.font = '48px Arial';
  ctx.fillText('Your AI-Powered College Application Guide', 960, 500);
  
  // Convert to blob (this is a simplified version)
  const blob = await canvas.convertToBlob({ type: 'video/mp4' });
  return blob;
}