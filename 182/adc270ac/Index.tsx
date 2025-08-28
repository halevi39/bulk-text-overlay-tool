import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, FileText, Image as ImageIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';

const HEBREW_FONTS = [
  { value: 'David', label: 'David - דוד' },
  { value: 'Narkisim', label: 'Narkisim - נרקיסים' },
  { value: 'Rod', label: 'Rod - רוד' },
  { value: 'Miriam', label: 'Miriam - מרים' },
  { value: 'Gisha', label: 'Gisha - גישה' },
  { value: 'Tahoma', label: 'Tahoma - תהומא' },
];

const ENGLISH_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
];

const EXPORT_RESOLUTIONS = [
  { value: '180', label: '180 DPI (1488x2126px)', width: 1488, height: 2126 },
  { value: '300', label: '300 DPI (2480x3543px)', width: 2480, height: 3543 }
];

const EXPORT_FORMATS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'pdf', label: 'PDF' }
];

export default function Index() {
  const [sampleImage, setSampleImage] = useState(null);
  const [targetImages, setTargetImages] = useState([]);
  const [textFile, setTextFile] = useState(null);
  const [textLines, setTextLines] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);
  const [processedImages, setProcessedImages] = useState([]);
  const [exportResolution, setExportResolution] = useState('180');
  const [exportFormat, setExportFormat] = useState('png');
  const [isHorizontal, setIsHorizontal] = useState(false);

  const [textBox, setTextBox] = useState({
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
      fontFamily: 'David'
    }
  });

  const containerRef = useRef(null);
  const sampleInputRef = useRef(null);
  const targetInputRef = useRef(null);
  const textInputRef = useRef(null);

  const detectLanguage = useCallback((text) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text) ? 'rtl' : 'ltr';
  }, []);

  const getExportDimensions = useCallback(() => {
    const resolution = EXPORT_RESOLUTIONS.find(r => r.value === exportResolution);
    if (isHorizontal) {
      return { width: resolution.height, height: resolution.width };
    }
    return { width: resolution.width, height: resolution.height };
  }, [exportResolution, isHorizontal]);

  const handleSampleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSampleImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      const img = new Image();
      img.onload = () => {
        const horizontal = img.width > img.height;
        setIsHorizontal(horizontal);
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

  const handleTargetUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setTargetImages(imageFiles);
      toast.success(`${imageFiles.length} target images uploaded`);
    } else {
      toast.error('Please select valid image files');
    }
  }, []);

  const handleTextFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTextFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        setTextLines(lines);
        toast.success(`Text file uploaded with ${lines.length} lines`);
      };
      reader.onerror = () => {
        toast.error('Error reading text file');
      };
      reader.readAsText(file);
    } else {
      toast.error('Please select a valid text file');
    }
  }, []);

  const handleMouseDown = useCallback((e, action, handle) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - (textBox.x * rect.width / imageDimensions.width), y: y - (textBox.y * rect.height / imageDimensions.height) });
    } else if (action === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x, y });
    }
  }, [textBox.x, textBox.y, imageDimensions]);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min((x - dragStart.x) * imageDimensions.width / rect.width, imageDimensions.width - textBox.width));
      const newY = Math.max(0, Math.min((y - dragStart.y) * imageDimensions.height / rect.height, imageDimensions.height - textBox.height));
      
      setTextBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && resizeHandle) {
      const deltaX = (x - dragStart.x) * imageDimensions.width / rect.width;
      const deltaY = (y - dragStart.y) * imageDimensions.height / rect.height;

      setTextBox(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = prev.x;
        let newY = prev.y;

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, prev.width + deltaX);
            newHeight = Math.max(30, prev.height + deltaY);
            break;
          case 'sw':
            newWidth = Math.max(50, prev.width - deltaX);
            newHeight = Math.max(30, prev.height + deltaY);
            newX = Math.max(0, prev.x + deltaX);
            break;
          case 'ne':
            newWidth = Math.max(50, prev.width + deltaX);
            newHeight = Math.max(30, prev.height - deltaY);
            newY = Math.max(0, prev.y + deltaY);
            break;
          case 'nw':
            newWidth = Math.max(50, prev.width - deltaX);
            newHeight = Math.max(30, prev.height - deltaY);
            newX = Math.max(0, prev.x + deltaX);
            newY = Math.max(0, prev.y + deltaY);
            break;
        }

        return { ...prev, x: newX, y: newY, width: newWidth, height: newHeight };
      });

      setDragStart({ x, y });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, imageDimensions, textBox.width, textBox.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging || isResizing) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const getTextStyle = () => {
    const { fontSize, color, strokeColor, strokeWidth, fontFamily, align } = textBox.style;
    const direction = detectLanguage(textBox.text);
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    const previewScale = containerRect ? containerRect.width / imageDimensions.width : 1;
    const previewFontSize = fontSize * previewScale;
    
    return {
      fontSize: `${previewFontSize}px`,
      color,
      fontFamily: `"${fontFamily}", "Arial", sans-serif`,
      textAlign: align,
      direction,
      lineHeight: '1.2',
      wordWrap: 'break-word',
      overflow: 'hidden',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      whiteSpace: 'pre-wrap',
      WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth * previewScale}px ${strokeColor}` : 'none',
      textShadow: strokeWidth > 0 ? 'none' : '2px 2px 4px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
      padding: '4px'
    };
  };

  const createImageWithText = useCallback(async (imageFile, text) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const exportDims = getExportDimensions();
      canvas.width = exportDims.width;
      canvas.height = exportDims.height;
      
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const imgAspect = img.width / img.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        const scaleX = drawWidth / imageDimensions.width;
        const scaleY = drawHeight / imageDimensions.height;
        
        const textX = drawX + (textBox.x * scaleX);
        const textY = drawY + (textBox.y * scaleY);
        const textWidth = textBox.width * scaleX;
        const textHeight = textBox.height * scaleY;
        
        const fontSize = textBox.style.fontSize * scaleX;
        
        const fontFamily = textBox.style.fontFamily;
        ctx.font = `${fontSize}px "${fontFamily}", "Arial", sans-serif`;
        ctx.fillStyle = textBox.style.color;
        ctx.textAlign = textBox.style.align;
        ctx.textBaseline = 'middle';
        
        const isRTL = detectLanguage(text) === 'rtl';
        ctx.direction = isRTL ? 'rtl' : 'ltr';
        
        let alignX = textX;
        if (textBox.style.align === 'center') {
          alignX = textX + textWidth / 2;
        } else if (textBox.style.align === 'right') {
          alignX = textX + textWidth;
        }
        
        const alignY = textY + textHeight / 2;
        
        if (textBox.style.strokeWidth > 0) {
          ctx.strokeStyle = textBox.style.strokeColor;
          ctx.lineWidth = textBox.style.strokeWidth * scaleX * 2;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(text, alignX, alignY);
        }
        
        ctx.fillText(text, alignX, alignY);
        
        const quality = exportFormat === 'jpg' ? 0.9 : undefined;
        canvas.toBlob((blob) => {
          resolve(blob);
        }, `image/${exportFormat}`, quality);
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  }, [imageDimensions, textBox, detectLanguage, getExportDimensions, exportFormat]);

  const handleBulkProcess = async () => {
    if (targetImages.length === 0 || textLines.length === 0) {
      toast.error('Please upload target images and text file');
      return;
    }

    setIsProcessing(true);
    const processed = [];

    try {
      const maxItems = Math.min(targetImages.length, textLines.length);
      
      for (let i = 0; i < maxItems; i++) {
        const result = await createImageWithText(targetImages[i], textLines[i]);
        processed.push(result);
        toast.success(`Processed ${i + 1}/${maxItems} images`);
      }
      
      setProcessedImages(processed);
      toast.success(`Successfully processed ${processed.length} images`);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Error processing images');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsZip = async () => {
    if (processedImages.length === 0) {
      toast.error('No processed images to download');
      return;
    }

    try {
      processedImages.forEach((blob, index) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `processed_image_${String(index + 1).padStart(3, '0')}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      toast.success(`Downloaded ${processedImages.length} images`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error creating download file');
    }
  };

  const resetAll = useCallback(() => {
    setSampleImage(null);
    setTargetImages([]);
    setTextFile(null);
    setTextLines([]);
    setImageUrl('');
    setImageDimensions({ width: 800, height: 600 });
    setProcessedImages([]);
    setIsHorizontal(false);
    setIsDragging(false);
    setIsResizing(false);
    setDragStart({ x: 0, y: 0 });
    setResizeHandle(null);
    
    setTextBox({
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
        fontFamily: 'David'
      }
    });
    
    if (sampleInputRef.current) sampleInputRef.current.value = '';
    if (targetInputRef.current) targetInputRef.current.value = '';
    if (textInputRef.current) textInputRef.current.value = '';
    
    toast.success('All data cleared successfully');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-4">
                Bulk Text Overlay Processing Tool
              </h1>
              <p className="text-sm sm:text-lg text-gray-600">
                Add variable text to multiple images with batch processing and professional export
              </p>
            </div>
            <Button 
              onClick={resetAll} 
              variant="outline" 
              size="sm"
              className="ml-4 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              🔄 Reset All
            </Button>
          </div>
        </div>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="design" className="text-xs sm:text-sm">Design</TabsTrigger>
            <TabsTrigger value="batch" className="text-xs sm:text-sm">Batch Setup</TabsTrigger>
            <TabsTrigger value="process" className="text-xs sm:text-sm">Process & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-4 sm:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">Sample Image & Text Design</CardTitle>
                  <CardDescription className="text-sm">
                    Upload a sample image and design your text overlay. Drag the text box to position it exactly where you want.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                      <input
                        ref={sampleInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSampleUpload}
                        className="hidden"
                      />
                      <Button onClick={() => sampleInputRef.current?.click()} variant="outline" className="w-full text-xs sm:text-sm">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Upload Sample Image
                      </Button>
                      {sampleImage && <p className="mt-2 text-xs sm:text-sm text-green-600">✓ {sampleImage.name}</p>}
                      {isHorizontal && <p className="mt-1 text-xs text-blue-600">📐 Horizontal layout detected</p>}
                    </div>

                    <div 
                      ref={containerRef}
                      className="relative border rounded-lg overflow-hidden bg-gray-100 select-none touch-none"
                      style={{ aspectRatio: isHorizontal ? '4/3' : '3/4', minHeight: '300px' }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                          
                          <div
                            className={`absolute border-2 ${isDragging || isResizing ? 'border-blue-600 bg-blue-600/20' : 'border-blue-500 bg-blue-500/10'} transition-colors pointer-events-auto`}
                            style={{
                              left: `${(textBox.x / imageDimensions.width) * 100}%`,
                              top: `${(textBox.y / imageDimensions.height) * 100}%`,
                              width: `${(textBox.width / imageDimensions.width) * 100}%`,
                              height: `${(textBox.height / imageDimensions.height) * 100}%`,
                              ...getTextStyle()
                            }}
                            onMouseDown={(e) => handleMouseDown(e, 'drag')}
                          >
                            {textBox.text}

                            {!isDragging && !isResizing && (
                              <>
                                <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-3 sm:h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize hover:bg-blue-600" onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')} />
                                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-3 sm:h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize hover:bg-blue-600" onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')} />
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 sm:w-3 sm:h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize hover:bg-blue-600" onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')} />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-3 sm:h-3 bg-blue-500 border border-white rounded-full cursor-se-resize hover:bg-blue-600" onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')} />
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2 sm:space-y-4 p-4">
                          <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16" />
                          <div className="text-center">
                            <p className="text-sm sm:text-lg font-medium">Upload a sample image to start designing</p>
                            <p className="text-xs sm:text-sm">This will be used to position text for all target images</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="text-lg sm:text-xl">Text Styling</CardTitle>
                  <CardDescription className="text-sm">Design your text appearance with real-time preview.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm">Sample Text Content</Label>
                    <Textarea
                      value={textBox.text}
                      onChange={(e) => setTextBox(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Enter sample text... הכנס טקסט לדוגמה"
                      className="min-h-[60px] sm:min-h-[80px] resize-none text-sm"
                      dir="auto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Font Family</Label>
                    <Select value={textBox.style.fontFamily} onValueChange={(value) => setTextBox(prev => ({ ...prev, style: { ...prev.style, fontFamily: value } }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1 text-sm font-medium text-gray-500">Hebrew Fonts</div>
                        {HEBREW_FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                        <div className="px-2 py-1 text-sm font-medium text-gray-500 border-t mt-2 pt-2">English Fonts</div>
                        {ENGLISH_FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Font Size: {textBox.style.fontSize}px</Label>
                      <Slider
                        value={[textBox.style.fontSize]}
                        onValueChange={([value]) => setTextBox(prev => ({ ...prev, style: { ...prev.style, fontSize: value } }))}
                        min={12}
                        max={500}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Text Alignment</Label>
                      <Select value={textBox.style.align} onValueChange={(value) => setTextBox(prev => ({ ...prev, style: { ...prev.style, align: value } }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={textBox.style.color}
                          onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, color: e.target.value } }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={textBox.style.color}
                          onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, color: e.target.value } }))}
                          className="flex-1 text-xs"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Stroke Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={textBox.style.strokeColor}
                          onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, strokeColor: e.target.value } }))}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={textBox.style.strokeColor}
                          onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, strokeColor: e.target.value } }))}
                          className="flex-1 text-xs"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Stroke Width: {textBox.style.strokeWidth}px</Label>
                    <Slider
                      value={[textBox.style.strokeWidth]}
                      onValueChange={([value]) => setTextBox(prev => ({ ...prev, style: { ...prev.style, strokeWidth: value } }))}
                      min={0}
                      max={10}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Target Images</CardTitle>
                  <CardDescription>Upload multiple images for processing</CardDescription>
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
                    <Button onClick={() => targetInputRef.current?.click()} variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Target Images
                    </Button>
                    {targetImages.length > 0 && (
                      <p className="mt-2 text-sm text-green-600">✓ {targetImages.length} images uploaded</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text File</CardTitle>
                  <CardDescription>Upload text file with one line per image</CardDescription>
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
                    <Button onClick={() => textInputRef.current?.click()} variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Text File
                    </Button>
                    {textFile && (
                      <p className="mt-2 text-sm text-green-600">✓ {textFile.name} ({textLines.length} lines)</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Settings</CardTitle>
                  <CardDescription>Configure output format and quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Export Resolution</Label>
                    <Select value={exportResolution} onValueChange={setExportResolution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPORT_RESOLUTIONS.map((resolution) => (
                          <SelectItem key={resolution.value} value={resolution.value}>
                            {resolution.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPORT_FORMATS.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing</CardTitle>
                  <CardDescription>Process images and download results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleBulkProcess}
                    disabled={isProcessing || targetImages.length === 0 || textLines.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Process All Images
                      </>
                    )}
                  </Button>

                  {processedImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">✅ Processing Complete!</p>
                        <p className="text-xs text-green-700">{processedImages.length} images processed</p>
                      </div>

                      <Button 
                        onClick={downloadAsZip}
                        className="w-full"
                        variant="outline"
                        size="lg"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Images
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
