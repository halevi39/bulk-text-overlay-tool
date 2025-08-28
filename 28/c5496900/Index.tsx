import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Settings, Image as ImageIcon, Type, FileText, Move, RotateCcw, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface TextStyle {
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  direction: 'ltr' | 'rtl';
}

interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style: TextStyle;
}

interface ExportSize {
  name: string;
  width: number;
  height: number;
  dpi: number;
}

const EXPORT_SIZES: ExportSize[] = [
  { name: '21x30cm @ 180 DPI', width: 1488, height: 2126, dpi: 180 },
  { name: '21x30cm @ 300 DPI', width: 2480, height: 3543, dpi: 300 }
];

const HEBREW_FONTS = [
  { value: 'David', label: 'דוד (David)', language: 'he' },
  { value: 'Narkisim', label: 'נרקיסים (Narkisim)', language: 'he' },
  { value: 'Rod', label: 'רוד (Rod)', language: 'he' },
  { value: 'Miriam', label: 'מרים (Miriam)', language: 'he' },
  { value: 'Gisha', label: 'גישה (Gisha)', language: 'he' },
  { value: 'Frank Ruehl CLM', label: 'פרנק רוהל (Frank Ruehl CLM)', language: 'he' },
  { value: 'Alef', label: 'אלף (Alef)', language: 'he' },
  { value: 'Rubik Hebrew', label: 'רוביק עברית (Rubik Hebrew)', language: 'he' },
  { value: 'Assistant Hebrew', label: 'אסיסטנט עברית (Assistant Hebrew)', language: 'he' },
  { value: 'Tahoma', label: 'Tahoma', language: 'both' },
];

const ENGLISH_FONTS = [
  { value: 'Arial', label: 'Arial', language: 'en' },
  { value: 'Times New Roman', label: 'Times New Roman', language: 'en' },
  { value: 'Calibri', label: 'Calibri', language: 'en' },
  { value: 'Georgia', label: 'Georgia', language: 'en' },
  { value: 'Helvetica', label: 'Helvetica', language: 'en' },
];

export default function Index() {
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [targetImages, setTargetImages] = useState<File[]>([]);
  const [customFonts, setCustomFonts] = useState<{ name: string; url: string }[]>([]);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [textLines, setTextLines] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportSize, setExportSize] = useState<ExportSize>(EXPORT_SIZES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<Blob[]>([]);

  const [textBox, setTextBox] = useState<TextBox>({
    x: 100,
    y: 100,
    width: 300,
    height: 100,
    text: 'שלום עולם Hello World',
    style: {
      fontSize: 36,
      color: '#000000',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      align: 'center',
      fontFamily: 'Tahoma',
      fontWeight: 'normal',
      fontStyle: 'normal',
      direction: 'ltr'
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sampleInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Detect Hebrew text and auto-set direction
  const detectLanguage = useCallback((text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text) ? 'rtl' : 'ltr';
  }, []);

  const handleSampleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSampleImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setTextBox(prev => ({
          ...prev,
          x: Math.max(20, (img.width - prev.width) / 2),
          y: Math.max(20, (img.height - prev.height) / 2)
        }));
      };
      img.src = url;
      
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
      const url = URL.createObjectURL(file);
      const fontName = file.name.replace(/\.(ttf|otf)$/, '');
      
      const fontFace = new FontFace(fontName, `url(${url})`);
      fontFace.load().then(() => {
        document.fonts.add(fontFace);
        setCustomFonts(prev => [...prev, { name: fontName, url }]);
        toast.success(`Font "${fontName}" uploaded and ready to use`);
      }).catch(() => {
        toast.error('Failed to load font file');
      });
    } else {
      toast.error('Please select a valid font file (.ttf or .otf)');
    }
  }, []);

  const handleTextFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setTextFile(file);
      file.text().then(content => {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        setTextLines(lines);
        toast.success(`Text file uploaded with ${lines.length} lines`);
      });
    } else {
      toast.error('Please select a valid text file');
    }
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    const direction = detectLanguage(newText);
    setTextBox(prev => ({
      ...prev,
      text: newText,
      style: { ...prev.style, direction }
    }));
  }, [detectLanguage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Professional Image Text Overlay Tool
          </h1>
          <p className="text-lg text-gray-600">
            Advanced text overlay with bulk processing, custom fonts, and professional export options
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Custom Font Upload
                  </CardTitle>
                  <CardDescription>
                    Upload custom font files (.ttf, .otf)
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                      Upload Font File
                    </Button>
                    {customFonts.length > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ {customFonts.length} custom fonts loaded
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Text File for Bulk Processing
                  </CardTitle>
                  <CardDescription>
                    Upload a text file with one line per image
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                      <div className="mt-2 text-sm text-green-600">
                        ✓ {textFile.name} ({textLines.length} lines)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="text-center p-8 bg-blue-50 rounded-lg">
              <Settings className="h-16 w-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Enhanced Preview Coming Soon</h3>
              <p className="text-gray-600">
                Advanced draggable text box with resize handles will be implemented in the next update
              </p>
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <div className="text-center p-8 bg-green-50 rounded-lg">
              <Archive className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Bulk Processing & Export</h3>
              <p className="text-gray-600">
                Professional export options and zip download functionality will be available soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}