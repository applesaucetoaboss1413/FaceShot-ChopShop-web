import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Repeat, 
  User, 
  Video, 
  Coins, 
  History, 
  Settings,
  LogOut,
  Zap,
  Image as ImageIcon,
  Loader2,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api, Job } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

type TransformationType = 'face-swap' | 'avatar' | 'image-to-video';

const transformations = [
  { 
    id: 'face-swap' as TransformationType, 
    name: 'Face Swap', 
    icon: Repeat, 
    credits: 1,
    description: 'Swap faces between two images',
    gradient: 'from-cyan-500 to-blue-500'
  },
  { 
    id: 'avatar' as TransformationType, 
    name: 'AI Avatar', 
    icon: User, 
    credits: 3,
    description: 'Generate unique AI avatars',
    gradient: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'image-to-video' as TransformationType, 
    name: 'Image to Video', 
    icon: Video, 
    credits: 5,
    description: 'Animate your static images',
    gradient: 'from-orange-500 to-red-500'
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<TransformationType>('face-swap');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [credits, setCredits] = useState(user?.credits || 0);

  // Fetch user credits and history on mount
  useEffect(() => {
    api.getCredits().then((result) => {
      if (result.success && result.data) {
        setCredits(result.data.balance);
      }
    });
    
    api.getJobHistory().then((result) => {
      if (result.success && result.data) {
        // Backend returns { items: [...] }
        const items = (result.data as any).items || result.data;
        setJobs(items);
      }
    });
  }, []);

  const handleFileUpload = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image under 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleProcess = async () => {
    if (!sourceImage) {
      toast({
        title: 'No image selected',
        description: 'Please upload a source image first.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedType === 'face-swap' && !targetImage) {
      toast({
        title: 'No target image',
        description: 'Face swap requires both source and target images.',
        variant: 'destructive',
      });
      return;
    }

    const requiredCredits = transformations.find(t => t.id === selectedType)?.credits || 1;
    if (credits < requiredCredits) {
      toast({
        title: 'Insufficient credits',
        description: 'Please purchase more credits to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    const result = await api.processJob({
      type: selectedType,
      sourceImage,
      targetImage: targetImage || undefined,
    });

    if (result.success && result.data) {
      setCurrentJob(result.data);
      setCredits(prev => prev - requiredCredits);
      
      // Poll for job completion
      const pollInterval = setInterval(async () => {
        const statusResult = await api.getJobStatus(result.data!.id);
        if (statusResult.success && statusResult.data) {
          setCurrentJob(statusResult.data);
          
          if (statusResult.data.status === 'completed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setJobs(prev => [statusResult.data!, ...prev]);
            toast({
              title: 'Processing complete!',
              description: 'Your image transformation is ready.',
            });
          } else if (statusResult.data.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            toast({
              title: 'Processing failed',
              description: 'Something went wrong. Please try again.',
              variant: 'destructive',
            });
          }
        }
      }, 2000);
    } else {
      setIsProcessing(false);
      toast({
        title: 'Processing failed',
        description: result.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const ImageUploader = ({ 
    image, 
    setImage, 
    label 
  }: { 
    image: string | null; 
    setImage: React.Dispatch<React.SetStateAction<string | null>>;
    label: string;
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
      {image ? (
        <div className="relative group">
          <img
            src={image}
            alt={label}
            className="w-full h-48 object-cover rounded-xl border border-border"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-2 rounded-lg bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload</p>
            <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileUpload(e, setImage)}
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold font-display">
              <span className="gradient-text">Chop</span>Shop
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Credits */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-semibold">{credits}</span>
              <span className="text-muted-foreground text-sm hidden sm:inline">credits</span>
            </div>

            <Link to="/pricing">
              <Button variant="glow" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Buy Credits
              </Button>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Transformation Selection & Upload */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transformation Type Selection */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Choose Transformation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {transformations.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedType === t.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3`}>
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="font-semibold mb-1">{t.name}</div>
                      <div className="text-xs text-muted-foreground mb-2">{t.description}</div>
                      <div className="text-xs text-primary font-medium">{t.credits} credits</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Upload Images</h2>
                <div className={`grid gap-4 ${selectedType === 'face-swap' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  <ImageUploader
                    image={sourceImage}
                    setImage={setSourceImage}
                    label={selectedType === 'face-swap' ? 'Source Face' : 'Source Image'}
                  />
                  {selectedType === 'face-swap' && (
                    <ImageUploader
                      image={targetImage}
                      setImage={setTargetImage}
                      label="Target Image"
                    />
                  )}
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleProcess}
                  disabled={isProcessing || !sourceImage}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate ({transformations.find(t => t.id === selectedType)?.credits} credits)
                    </>
                  )}
                </Button>
              </div>

              {/* Current Job Result */}
              {currentJob && currentJob.status === 'completed' && currentJob.outputUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-semibold mb-4">Result</h2>
                  <div className="relative group">
                    <img
                      src={currentJob.outputUrl}
                      alt="Result"
                      className="w-full rounded-xl border border-border"
                    />
                    <a
                      href={currentJob.outputUrl}
                      download
                      className="absolute bottom-4 right-4 p-3 rounded-xl bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Panel - History */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">History</h2>
                  <History className="w-5 h-5 text-muted-foreground" />
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No creations yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Your processed images will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        {job.outputUrl ? (
                          <img
                            src={job.outputUrl}
                            alt="Job result"
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm capitalize truncate">
                            {job.type.replace('-', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' 
                            ? 'bg-green-500/20 text-green-400'
                            : job.status === 'failed'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Total Creations</span>
                    <span className="font-semibold">{jobs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Available Credits</span>
                    <span className="font-semibold text-primary">{credits}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
