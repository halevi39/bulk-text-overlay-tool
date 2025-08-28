import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Eye, Settings, Image as ImageIcon, Type, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextStyle {
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  align: 'left' | 'center' | 'right';
}

export default function Index() {
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [targetImages, setTargetImages] = useState<File[]>([]);
  const [customFont, setCustomFont] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState('Sample Text');
  const [region, setRegion] = useState<Region>({ x: 20, y: 37.5, w: 60, h: 25 });
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontSize: 120,
    color: '#000000',
    strokeColor: '#ffffff',
    strokeWidth: 0,
    align: 'center'
  });
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [jpgQuality, setJpgQuality] = useState(95);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleSampleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSampleImage(file);
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

  const handleFontUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.name.endsWith('.ttf') || file.name.endsWith('.otf'))) {
      setCustomFont(file);
      toast.success('Font uploaded successfully');
    } else {
      toast.error('Please select a valid font file (.ttf or .otf)');
    }
  }, []);

  const handleTextFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setTextFile(file);
      toast.success('Text file uploaded successfully');
    } else {
      toast.error('Please select a valid text file');
    }
  }, []);

  const drawPreview = useCallback(async () => {
    if (!sampleImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Calculate region coordinates
      const rx = (region.x / 100) * img.width;
      const ry = (region.y / 100) * img.height;
      const rw = (region.w / 100) * img.width;
      const rh = (region.h / 100) * img.height;

      // Draw region outline
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);

      // Set font and measure text
      ctx.font = `${textStyle.fontSize}px Arial`;
      const metrics = ctx.measureText(previewText);
      const textWidth = metrics.width;
      const textHeight = textStyle.fontSize;

      // Calculate text position based on alignment
      let x = rx;
      if (textStyle.align === 'center') {
        x = rx + (rw - textWidth) / 2;
      } else if (textStyle.align === 'right') {
        x = rx + rw - textWidth;
      }
      const y = ry + (rh + textHeight) / 2;

      // Draw text with stroke if specified
      if (textStyle.strokeWidth > 0) {
        ctx.strokeStyle = textStyle.strokeColor;
        ctx.lineWidth = textStyle.strokeWidth;
        ctx.strokeText(previewText, x, y);
      }
      
      ctx.fillStyle = textStyle.color;
      ctx.fillText(previewText, x, y);
    };

    img.src = URL.createObjectURL(sampleImage);
  }, [sampleImage, previewText, region, textStyle]);

  const handleProcess = async () => {
    if (!textFile || targetImages.length === 0) {
      toast.error('Please upload text file and target images');
      return;
    }

    setIsProcessing(true);
    try {
      // Read text file
      const textContent = await textFile.text();
      const lines = textContent.split('\n').filter(line => line.trim() !== '');

      if (lines.length === 0) {
        toast.error('Text file is empty');
        return;
      }

      // Process each image
      const processedImages: Blob[] = [];
      
      for (let i = 0; i < Math.min(lines.length, targetImages.length); i++) {
        const text = lines[i].trim();
        const targetImage = targetImages[i];
        
        const processedImage = await processImage(targetImage, text);
        if (processedImage) {
          processedImages.push(processedImage);
        }
      }

      if (processedImages.length > 0) {
        await downloadProcessedImages(processedImages);
        toast.success(`Successfully processed ${processedImages.length} images`);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Error processing images');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (targetImage: File, text: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Calculate region coordinates
        const rx = (region.x / 100) * img.width;
        const ry = (region.y / 100) * img.height;
        const rw = (region.w / 100) * img.width;
        const rh = (region.h / 100) * img.height;

        // Auto-size font to fit region
        let fontSize = textStyle.fontSize;
        ctx.font = `${fontSize}px Arial`;
        let metrics = ctx.measureText(text);
        
        while ((metrics.width > rw || fontSize > rh) && fontSize > 4) {
          fontSize -= 1;
          ctx.font = `${fontSize}px Arial`;
          metrics = ctx.measureText(text);
        }

        // Calculate text position
        let x = rx;
        if (textStyle.align === 'center') {
          x = rx + (rw - metrics.width) / 2;
        } else if (textStyle.align === 'right') {
          x = rx + rw - metrics.width;
        }
        const y = ry + (rh + fontSize) / 2;

        // Draw text with stroke if specified
        if (textStyle.strokeWidth > 0) {
          ctx.strokeStyle = textStyle.strokeColor;
          ctx.lineWidth = textStyle.strokeWidth;
          ctx.strokeText(text, x, y);
        }
        
        ctx.fillStyle = textStyle.color;
        ctx.fillText(text, x, y);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, exportFormat === 'jpg' ? 'image/jpeg' : 'image/png', jpgQuality / 100);
      };

      img.src = URL.createObjectURL(targetImage);
    });
  };

  const downloadProcessedImages = async (images: Blob[]) => {
    if (images.length === 1) {
      // Single image download
      const url = URL.createObjectURL(images[0]);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_image.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Multiple images - create zip (simplified version)
      toast.info('Multiple images processed. Downloading individually...');
      images.forEach((blob, index) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_image_${index + 1}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Image Text Overlay Tool
          </h1>
          <p className="text-lg text-gray-600">
            Add text overlays to your images with customizable styling and batch processing
          </p>
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Style
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Process
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
                <CardContent className="space-y-4">
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
                <CardContent className="space-y-4">
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Custom Font
                  </CardTitle>
                  <CardDescription>
                    Upload a custom font file (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fontInputRef}
                      type="file"
                      accept=".ttf,.otf"
                      onChange={handleFontUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fontInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Font File
                    </Button>
                    {customFont && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {customFont.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Text File
                  </CardTitle>
                  <CardDescription>
                    Upload a text file with lines for batch processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={textInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleTextFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => textInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Text File
                    </Button>
                    {textFile && (
                      <p className="mt-2 text-sm text-green-600">
                        ✓ {textFile.name}
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
                  <CardTitle>Preview Settings</CardTitle>
                  <CardDescription>
                    Adjust text and region settings to preview the overlay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preview-text">Preview Text</Label>
                    <Input
                      id="preview-text"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="Enter text to preview"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>X Position (%)</Label>
                      <Slider
                        value={[region.x]}
                        onValueChange={([value]) => setRegion({ ...region, x: value })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{region.x}%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Y Position (%)</Label>
                      <Slider
                        value={[region.y]}
                        onValueChange={([value]) => setRegion({ ...region, y: value })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{region.y}%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Width (%)</Label>
                      <Slider
                        value={[region.w]}
                        onValueChange={([value]) => setRegion({ ...region, w: value })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{region.w}%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Height (%)</Label>
                      <Slider
                        value={[region.h]}
                        onValueChange={([value]) => setRegion({ ...region, h: value })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{region.h}%</span>
                    </div>
                  </div>

                  <Button onClick={drawPreview} className="w-full" disabled={!sampleImage}>
                    Update Preview
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview Canvas</CardTitle>
                  <CardDescription>
                    See how your text overlay will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto"
                      style={{ maxHeight: '400px' }}
                    />
                    {!sampleImage && (
                      <div className="h-64 flex items-center justify-center text-gray-400">
                        Upload a sample image to see preview
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Styling</CardTitle>
                <CardDescription>
                  Customize the appearance of your text overlay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Slider
                        value={[textStyle.fontSize]}
                        onValueChange={([value]) => setTextStyle({ ...textStyle, fontSize: value })}
                        min={12}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{textStyle.fontSize}px</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="text-color">Text Color</Label>
                      <Input
                        id="text-color"
                        type="color"
                        value={textStyle.color}
                        onChange={(e) => setTextStyle({ ...textStyle, color: e.target.value })}
                        className="w-full h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Text Alignment</Label>
                      <Select value={textStyle.align} onValueChange={(value: 'left' | 'center' | 'right') => setTextStyle({ ...textStyle, align: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Stroke Width</Label>
                      <Slider
                        value={[textStyle.strokeWidth]}
                        onValueChange={([value]) => setTextStyle({ ...textStyle, strokeWidth: value })}
                        min={0}
                        max={10}
                        step={1}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-500">{textStyle.strokeWidth}px</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stroke-color">Stroke Color</Label>
                      <Input
                        id="stroke-color"
                        type="color"
                        value={textStyle.strokeColor}
                        onChange={(e) => setTextStyle({ ...textStyle, strokeColor: e.target.value })}
                        className="w-full h-12"
                        disabled={textStyle.strokeWidth === 0}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
                <CardDescription>
                  Configure export format and process your images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value: 'png' | 'jpg' | 'pdf') => setExportFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpg">JPG</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {exportFormat === 'jpg' && (
                      <div className="space-y-2">
                        <Label>JPG Quality</Label>
                        <Slider
                          value={[jpgQuality]}
                          onValueChange={([value]) => setJpgQuality(value)}
                          min={1}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{jpgQuality}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Ready to Process</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• Sample Image: {sampleImage ? '✓' : '✗'}</p>
                        <p>• Target Images: {targetImages.length > 0 ? `✓ ${targetImages.length}` : '✗'}</p>
                        <p>• Text File: {textFile ? '✓' : '✗'}</p>
                        <p>• Custom Font: {customFont ? '✓' : 'Using default'}</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleProcess}
                      disabled={!textFile || targetImages.length === 0 || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Process Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}