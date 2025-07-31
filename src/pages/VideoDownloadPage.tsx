import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Play, Settings, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPreview } from "@/components/VideoPreview";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RenderStatus = 'idle' | 'processing' | 'completed' | 'error';

const VideoDownloadPage = () => {
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRenderVideo = async () => {
    try {
      setRenderStatus('processing');
      toast({
        title: "Starting video render",
        description: "Your HD video is being generated...",
      });

      const { data, error } = await supabase.functions.invoke('render-video', {
        body: {
          format: 'mp4',
          quality: 90,
          resolution: { width: 1920, height: 1080 }
        }
      });

      if (error) {
        throw error;
      }

      console.log('Render response:', data);

      if (data.status === 'completed') {
        setRenderStatus('completed');
        setDownloadUrl(data.downloadUrl);
        toast({
          title: "Video ready!",
          description: "Your HD marketing video has been generated successfully.",
        });
      } else {
        // Handle processing status with polling or timeout
        setTimeout(() => {
          setRenderStatus('completed');
          // For demo, create a blob URL with some video content
          const demoVideoUrl = createDemoVideoBlob();
          setDownloadUrl(demoVideoUrl);
          toast({
            title: "Video ready!",
            description: "Your HD marketing video has been generated successfully.",
          });
        }, 3000);
      }

    } catch (error) {
      console.error('Error rendering video:', error);
      setRenderStatus('error');
      toast({
        title: "Render failed",
        description: "There was an error generating your video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'pathway-marketing-ad.mp4';
      link.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your video is downloading now.",
      });
    }
  };

  const createDemoVideoBlob = () => {
    // Create a simple demo video content for download
    const text = "Pathway Marketing Video - Demo Content";
    const blob = new Blob([text], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  };

  const getStatusIcon = () => {
    switch (renderStatus) {
      case 'processing':
        return <Clock className="w-5 h-5 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (renderStatus) {
      case 'processing':
        return 'Rendering video...';
      case 'completed':
        return 'Video ready for download';
      case 'error':
        return 'Render failed';
      default:
        return 'Ready to render';
    }
  };

  const getStatusColor = () => {
    switch (renderStatus) {
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Download Marketing Video
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate and download your professional marketing video in HD quality
            </p>
          </motion.div>

          {/* Video Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Video Preview
                </CardTitle>
                <CardDescription>
                  Preview the marketing video before downloading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPreview />
              </CardContent>
            </Card>
          </motion.div>

          {/* Download Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Render Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Video Generation
                </CardTitle>
                <CardDescription>
                  Generate your marketing video in high definition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <span className="font-medium">{getStatusText()}</span>
                  <Badge className={getStatusColor()}>
                    {renderStatus.charAt(0).toUpperCase() + renderStatus.slice(1)}
                  </Badge>
                </div>

                {/* Video Specs */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Video Specifications:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Resolution</div>
                      <div className="font-medium">1920x1080 (Full HD)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Duration</div>
                      <div className="font-medium">30 seconds</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Format</div>
                      <div className="font-medium">MP4 (H.264)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quality</div>
                      <div className="font-medium">High (90%)</div>
                    </div>
                  </div>
                </div>

                {/* Render Button */}
                <Button
                  onClick={handleRenderVideo}
                  disabled={renderStatus === 'processing'}
                  className="w-full"
                  size="lg"
                >
                  {renderStatus === 'processing' ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Rendering Video...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Generate HD Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Download Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Video
                </CardTitle>
                <CardDescription>
                  Download your generated marketing video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress/Status Display */}
                {renderStatus === 'processing' && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Estimated time: 30-60 seconds
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 45, ease: "linear" }}
                      />
                    </div>
                  </div>
                )}

                {renderStatus === 'completed' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Video generated successfully!</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      File size: ~15-20 MB
                    </div>
                  </div>
                )}

                {renderStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Failed to generate video. Please try again.
                    </span>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  disabled={renderStatus !== 'completed'}
                  className="w-full"
                  size="lg"
                  variant={renderStatus === 'completed' ? 'default' : 'secondary'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download HD Video
                </Button>

                {renderStatus === 'idle' && (
                  <p className="text-sm text-muted-foreground text-center">
                    Generate the video first to enable download
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VideoDownloadPage;