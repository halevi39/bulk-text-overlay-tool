import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, Archive, Move, RotateCcw } from "lucide-react";

export default function Index() {
  // State management
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [textBox, setTextBox] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 50,
    text: 'Sample Text שלום',
    style: {
      fontSize: 24,
      color: '#000000',
      strokeWidth: 0,
      strokeColor: '#ffffff',
      fontFamily: 'Arial',
      align: 'center' as 'left' | 'center' | 'right'
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hebrew fonts
  const HEBREW_FONTS = [
    { label: 'David Libre', value: 'David Libre' },
    { label: 'Frank Ruehl Libre', value: 'Frank Ruehl Libre' },
    { label: 'Heebo', value: 'Heebo' },
    { label: 'Rubik', value: 'Rubik' },
    { label: 'Assistant', value: 'Assistant' },
    { label: 'Alef', value: 'Alef' }
  ];

  const ENGLISH_FONTS = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' }
  ];

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSampleImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - textBox.x,
      y: e.clientY - textBox.y
    });
  }, [textBox.x, textBox.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setTextBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(400, e.clientX - dragStart.x)),
        y: Math.max(0, Math.min(300, e.clientY - dragStart.y))
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  // Canvas image generation
  const generateImage = useCallback(() => {
    if (!sampleImage || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size for 21x30cm at 180 DPI
    canvas.width = 1488;
    canvas.height = 2126;

    const img = new Image();
    img.onload = () => {
      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw text
      ctx.font = `${textBox.style.fontSize * 2}px ${textBox.style.fontFamily}`;
      ctx.fillStyle = textBox.style.color;
      ctx.textAlign = textBox.style.align;

      // Apply stroke if enabled
      if (textBox.style.strokeWidth > 0) {
        ctx.strokeStyle = textBox.style.strokeColor;
        ctx.lineWidth = textBox.style.strokeWidth * 2;
        ctx.strokeText(textBox.text, textBox.x * 3.7, textBox.y * 7.1);
      }

      ctx.fillText(textBox.text, textBox.x * 3.7, textBox.y * 7.1);
    };
    img.src = sampleImage;

    return canvas;
  }, [sampleImage, textBox]);

  // Download single image
  const downloadSingleImage = () => {
    const canvas = generateImage();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'text-overlay-image.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Image Text Overlay Tool</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="preview">Preview & Style</TabsTrigger>
          <TabsTrigger value="process">Process & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Sample Image</CardTitle>
              <CardDescription>
                Upload the image you want to add text overlay to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Click to upload sample image</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-xs mx-auto"
                  />
                </div>
                {sampleImage && (
                  <div className="mt-4">
                    <img src={sampleImage} alt="Sample" className="max-w-full h-auto rounded-lg" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Preview</CardTitle>
                <CardDescription>
                  Drag the text box to position it on your image
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sampleImage ? (
                  <div 
                    className="relative border rounded-lg overflow-hidden"
                    style={{ width: '400px', height: '300px' }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                  >
                    <img 
                      src={sampleImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {/* Interactive Text Box */}
                    <div
                      className="absolute border-2 border-blue-500 bg-black bg-opacity-20 cursor-move select-none"
                      style={{
                        left: `${textBox.x}px`,
                        top: `${textBox.y}px`,
                        width: `${textBox.width}px`,
                        height: `${textBox.height}px`,
                      }}
                      onMouseDown={handleMouseDown}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center text-white font-bold"
                        style={{
                          fontSize: `${Math.min(textBox.style.fontSize, 20)}px`,
                          fontFamily: textBox.style.fontFamily,
                          color: textBox.style.color,
                          textAlign: textBox.style.align,
                          WebkitTextStroke: textBox.style.strokeWidth > 0 ? 
                            `${textBox.style.strokeWidth}px ${textBox.style.strokeColor}` : 'none'
                        }}
                      >
                        {textBox.text}
                      </div>
                      {/* Resize Handles */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize"></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Upload an image to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text Styling</CardTitle>
                <CardDescription>
                  Customize your text appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text Content</Label>
                  <Textarea
                    id="text-input"
                    value={textBox.text}
                    onChange={(e) => setTextBox(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your text here..."
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select 
                    value={textBox.style.fontFamily} 
                    onValueChange={(value) => 
                      setTextBox(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, fontFamily: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1 text-sm font-medium text-gray-500">Hebrew Fonts</div>
                      {HEBREW_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-sm font-medium text-gray-500 border-t mt-2 pt-2">English Fonts</div>
                      {ENGLISH_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Slider
                      value={[textBox.style.fontSize]}
                      onValueChange={([value]) => setTextBox(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, fontSize: value }
                      }))}
                      min={12}
                      max={120}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{textBox.style.fontSize}px</span>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <Select 
                      value={textBox.style.align} 
                      onValueChange={(value: 'left' | 'center' | 'right') => 
                        setTextBox(prev => ({ 
                          ...prev, 
                          style: { ...prev.style, align: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left / שמאל</SelectItem>
                        <SelectItem value="center">Center / מרכז</SelectItem>
                        <SelectItem value="right">Right / ימין</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={textBox.style.color}
                      onChange={(e) => setTextBox(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, color: e.target.value }
                      }))}
                      className="w-full h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stroke Width</Label>
                    <Slider
                      value={[textBox.style.strokeWidth]}
                      onValueChange={([value]) => setTextBox(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, strokeWidth: value }
                      }))}
                      min={0}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{textBox.style.strokeWidth}px</span>
                  </div>
                </div>

                {textBox.style.strokeWidth > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="stroke-color">Stroke Color</Label>
                    <Input
                      id="stroke-color"
                      type="color"
                      value={textBox.style.strokeColor}
                      onChange={(e) => setTextBox(prev => ({ 
                        ...prev, 
                        style: { ...prev.style, strokeColor: e.target.value }
                      }))}
                      className="w-full h-12"
                    />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={downloadSingleImage}
                    disabled={!sampleImage}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Single Image
                  </Button>
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
                <h3 className="text-lg font-medium mb-2">Export Ready</h3>
                <p className="text-gray-600 mb-4">
                  Your image with text overlay is ready for export
                </p>
                <Button 
                  onClick={downloadSingleImage}
                  disabled={!sampleImage}
                  className="mt-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Image (21x30cm @ 180 DPI)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}