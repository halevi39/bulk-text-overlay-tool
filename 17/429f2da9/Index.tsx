import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Settings, Image as ImageIcon, Type, FileText, Move, RotateCcw } from 'lucide-react';
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

const HEBREW_FONTS = [
  { value: 'David', label: 'דוד (David)', language: 'he' },
  { value: 'Narkisim', label: 'נרקיסים (Narkisim)', language: 'he' },
  { value: 'Rod', label: 'רוד (Rod)', language: 'he' },
  { value: 'Miriam', label: 'מרים (Miriam)', language: 'he' },
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
  const [customFont, setCustomFont] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [jpgQuality, setJpgQuality] = useState(95);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const [textBox, setTextBox] = useState<TextBox>({
    x: 20,
    y: 20,
    width: 300,
    height: 100,
    text: 'שלום עולם Hello World',
    style: {
      fontSize: 36,
      color: '#000000',
      strokeColor: '#ffffff',
      strokeWidth: 0,
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
        <div className="text-center">Basic interface loaded successfully</div>
      </div>
    </div>
  );
}