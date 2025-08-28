import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Settings, Image as ImageIcon, Type, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [targetImages, setTargetImages] = useState<File[]>([]);
  const [textContent, setTextContent] = useState('שלום עולם Hello World');
  const [fontSize, setFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Tahoma');
  const [imageUrl, setImageUrl] = useState<string>('');

  const sampleInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const handleSampleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSampleImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      toast.success('Sample image uploaded successfully');
    } else {
      toast.error('Please select a valid image file');
    }
  }, []);

  const handleTargetUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setTargetImages(imageFiles);
      toast.success(`${imageFiles.length} target images uploaded`);
    } else {
      toast.error('Please select valid image files');
    }
  }, []);

  const detectLanguage = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text) ? 'rtl' : 'ltr';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Image Text Overlay Tool
          </h1>
          <p className="text-lg text-gray-600">
            Add text overlays with real-time preview and Hebrew support
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Live Preview & Style
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Process & Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Sample Image
                  </CardTitle>
                  <CardDescription>
                    Upload a sample image to preview text overlay positioning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={sampleInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSampleUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => sampleInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Sample Image
                    </Button>
                    {sampleImage && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {sampleImage.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Target Images
                  </CardTitle>
                  <CardDescription>
                    Upload multiple images for batch processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={targetInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleTargetUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => targetInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Target Images
                    </Button>
                    {targetImages.length > 0 && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {targetImages.length} images selected
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See how your text will appear on the image
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative border rounded-lg overflow-hidden bg-gray-100 min-h-[400px]">
                    {imageUrl ? (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-auto object-contain"
                          draggable={false}
                        />
                        <div 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 bg-black bg-opacity-20 rounded"
                          style={{
                            fontSize: `${fontSize}px`,
                            color: textColor,
                            fontFamily: fontFamily,
                            direction: detectLanguage(textContent),
                            textAlign: 'center',
                            whiteSpace: 'pre-wrap',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                          }}
                        >
                          {textContent}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <ImageIcon className="h-16 w-16" />
                        <div className="text-center">
                          <p className="text-lg font-medium">Upload a sample image to start editing</p>
                          <p className="text-sm">Go to Upload Files tab to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Styling</CardTitle>
                  <CardDescription>
                    Customize the appearance of your text overlay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="text-content">Text Content</Label>
                    <Textarea
                      id="text-content"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter your text here... הכנס טקסט כאן"
                      className="min-h-[80px] resize-none"
                      dir="auto"
                    />
                    <div className="text-xs text-gray-500">
                      Characters: {textContent.length} • Direction: {detectLanguage(textContent).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="David">דוד (David)</SelectItem>
                        <SelectItem value="Narkisim">נרקיסים (Narkisim)</SelectItem>
                        <SelectItem value="Tahoma">Tahoma</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([value]) => setFontSize(value)}
                      min={12}
                      max={120}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{fontSize}px</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-12"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings & Processing</CardTitle>
                <CardDescription>
                  Configure export format and process your images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Process</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your sample image and target images to begin batch processing
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>• Sample Image: {sampleImage ? '✓' : '✗'}</p>
                    <p>• Target Images: {targetImages.length > 0 ? `✓ ${targetImages.length}` : '✗'}</p>
                  </div>
                  <Button 
                    className="mt-4" 
                    disabled={!sampleImage || targetImages.length === 0}
                    onClick={() => toast.success('Processing feature coming soon!')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Process Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}