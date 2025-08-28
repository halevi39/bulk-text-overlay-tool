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
import JSZip from 'jszip';
import jsPDF from 'jspdf';

const HEBREW_FONTS = [
  { value: 'David', label: 'דוד (David)' },
  { value: 'Narkisim', label: 'נרקיסים (Narkisim)' },
  { value: 'Rod', label: 'רוד (Rod)' },
  { value: 'Miriam', label: 'מרים (Miriam)' },
  { value: 'Gisha', label: 'גישה (Gisha)' },
  { value: 'Tahoma', label: 'Tahoma' },
];

const ENGLISH_FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Helvetica', label: 'Helvetica' },
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
      fontFamily: 'Tahoma'
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

  const handleTextChange = useCallback((newText) => {
    setTextBox(prev => ({
      ...prev,
      text: newText
    }));
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

  const handleTouchStart = useCallback((e, action, handle) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({ x: x - (textBox.x * rect.width / imageDimensions.width), y: y - (textBox.y * rect.height / imageDimensions.height) });
    } else if (action === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x, y });
    }
  }, [textBox.x, textBox.y, imageDimensions]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

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

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging || isResizing) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    const handleGlobalTouchMove = (e) => {
      if (isDragging || isResizing) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      handleMouseUp();
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleTouchMove]);

  const getTextStyle = () => {
    const { fontSize, color, strokeColor, strokeWidth, fontFamily, align } = textBox.style;
    const direction = detectLanguage(textBox.text);
    
    return {
      fontSize: `${fontSize}px`,
      color,
      fontFamily: `"${fontFamily}", Arial, sans-serif`,
      textAlign: align,
      direction,
      lineHeight: '1.2',
      wordWrap: 'break-word',
      overflow: 'hidden',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      whiteSpace: 'pre-wrap',
      WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none',
      textShadow: strokeWidth > 0 ? 'none' : '2px 2px 4px rgba(0,0,0,0.3)'
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
        const scale = Math.min(scaleX, scaleY);
        
        const textX = drawX + (textBox.x * scaleX);
        const textY = drawY + (textBox.y * scaleY);
        const textWidth = textBox.width * scaleX;
        const textHeight = textBox.height * scaleY;
        const fontSize = textBox.style.fontSize * scale;
        
        ctx.font = `${fontSize}px "${textBox.style.fontFamily}", Arial, sans-serif`;
        ctx.fillStyle = textBox.style.color;
        ctx.textAlign = textBox.style.align;
        ctx.textBaseline = 'middle';
        ctx.direction = detectLanguage(text) === 'rtl' ? 'rtl' : 'ltr';
        
        let alignX = textX;
        if (textBox.style.align === 'center') {
          alignX = textX + textWidth / 2;
        } else if (textBox.style.align === 'right') {
          alignX = textX + textWidth;
        }
        
        const alignY = textY + textHeight / 2;
        
        if (textBox.style.strokeWidth > 0) {
          ctx.strokeStyle = textBox.style.strokeColor;
          ctx.lineWidth = textBox.style.strokeWidth * scale * 2;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(text, alignX, alignY);
        }
        
        ctx.fillText(text, alignX, alignY);
        
        if (exportFormat === 'pdf') {
          resolve(canvas.toDataURL('image/png'));
        } else {
          const quality = exportFormat === 'jpg' ? 0.9 : undefined;
          canvas.toBlob((blob) => {
            resolve(blob);
          }, `image/${exportFormat}`, quality);
        }
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
      if (exportFormat === 'pdf') {
        const pdf = new jsPDF({
          orientation: isHorizontal ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [210, 297]
        });
        
        for (let i = 0; i < processedImages.length; i++) {
          if (i > 0) pdf.addPage();
          
          const imgData = processedImages[i];
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }
        
        pdf.save('processed_images.pdf');
        toast.success(`Downloaded ${processedImages.length} images as PDF`);
      } else {
        const zip = new JSZip();
        
        processedImages.forEach((blob, index) => {
          zip.file(`processed_image_${String(index + 1).padStart(3, '0')}.${exportFormat}`, blob);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Downloaded ${processedImages.length} images as ZIP file`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error creating download file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-4">
            Bulk Text Overlay Processing Tool
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            Add variable text to multiple images with batch processing and professional export
          </p>
        </div>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="design" className="text-xs sm:text-sm">Design</TabsTrigger>
            <TabsTrigger value="batch" className="text-xs sm:text-sm">Batch Setup</TabsTrigger>
            <TabsTrigger value="process" className="text-xs sm:text-sm">Process & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sample Image Upload</CardTitle>
                <CardDescription>Upload a sample image to design your text overlay</CardDescription>
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
                  <Button onClick={() => sampleInputRef.current?.click()} variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Sample Image
                  </Button>
                  {sampleImage && <p className="mt-2 text-sm text-green-600">✓ {sampleImage.name}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Styling</CardTitle>
                <CardDescription>Configure your text appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sample Text</Label>
                  <Textarea
                    value={textBox.text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Enter sample text"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select value={textBox.style.fontFamily} onValueChange={(value) => setTextBox(prev => ({ ...prev, style: { ...prev.style, fontFamily: value } }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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

                  <div className="space-y-2">
                    <Label>Font Size: {textBox.style.fontSize}px</Label>
                    <Slider
                      value={[textBox.style.fontSize]}
                      onValueChange={([value]) => setTextBox(prev => ({ ...prev, style: { ...prev.style, fontSize: value } }))}
                      min={12}
                      max={120}
                      step={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <Input
                      type="color"
                      value={textBox.style.color}
                      onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, color: e.target.value } }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stroke Color</Label>
                    <Input
                      type="color"
                      value={textBox.style.strokeColor}
                      onChange={(e) => setTextBox(prev => ({ ...prev, style: { ...prev.style, strokeColor: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stroke Width: {textBox.style.strokeWidth}px</Label>
                  <Slider
                    value={[textBox.style.strokeWidth]}
                    onValueChange={([value]) => setTextBox(prev => ({ ...prev, style: { ...prev.style, strokeWidth: value } }))}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
              </CardContent>
            </Card>
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
                        Download {exportFormat === 'pdf' ? 'PDF' : 'ZIP File'}
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