import React, { 
   useCallback, 
   useEffect, 
   useMemo,    
   useRef,    
   useState  
} from 'react';

import { 
  Download,  
  FileImage, 
  GripVertical, 
  Moon,
  Sun,
  Upload, 
  X 
} from 'lucide-react';

import { 
  DndProvider,  
  useDrag,     
  useDrop     
} from 'react-dnd';

import { HTML5Backend } from 'react-dnd-html5-backend';

import jsPDF from 'jspdf';

type ImageFile = {
  id: string;
  file: File;
  preview: string;
};

type ThemeProps = {
  isDark: boolean;
};

type ImageThumbnailProps = ThemeProps & {

  image: ImageFile;
  index: number;
  isRemoving: boolean;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (id: string) => void;
};

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;
const ACCEPTED_IMAGE_LABEL = 'JPG and PNG files';
const DOWNLOAD_FILE_NAME = 'converted.pdf';

function cn(...classes: Array<string | false | null | undefined>) {

  return classes.filter(Boolean).join(' ');
}

function createImageId(file: File) {
  return `${file.name}-${file.lastModified}-${crypto.randomUUID()}`;
}

function readFileAsDataURL(file: File): Promise<string> 
{
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getPdfImageFormat(file: File) {
  return file.type === 'image/png' ? 'PNG' : 'JPEG';
}

function ImageThumbnail({ image, index, isRemoving, moveImage, removeImage, isDark }: ImageThumbnailProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag({

    type: 'image',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({

    accept: 'image',
    hover: (item: { index: number }) => {
      if (item.index === index) return;
      moveImage(item.index, index);
      item.index = index;
    },
  });

  return (
    <div
      ref={(node) => {
        dragPreview(drop(node));
      }}
      className={cn(
        'smooth-thumbnail-in relative group overflow-hidden rounded-lg shadow-md transition-all',
        isDark ? 'bg-gray-800' : 'bg-white/90 ring-1 ring-sky-100',
        isRemoving && 'smooth-thumbnail-out pointer-events-none',
        isDragging ? 'scale-95 opacity-50' : 'scale-100 opacity-100',  
      )}
      style={{ animationDelay: `${Math.min(index * 45, 240)}ms` }}
    >
    <div
        ref={(node) => {
          drag(node);
        }}
        className={cn(
          'absolute left-2 top-2 z-10 cursor-move rounded p-1 opacity-0 transition-opacity group-hover:opacity-100',
          isDark ? 'bg-gray-700/90' : 'bg-white/90 shadow-sm',
        )}
        aria-label="Drag image to reorder"
      >
        <GripVertical className={cn('h-5 w-5', isDark ? 'text-gray-300' : 'text-sky-600')} />
      </div>

      <button
        type="button"
        onClick={() => removeImage(image.id)}
        className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1 
        text-white opacity-0 transition-opacity 
        hover:bg-red-600 group-hover:opacity-100"
        aria-label={`Remove ${image.file.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    
      <img src={image.preview} alt={image.file.name} className="h-40 w-full object-cover" />
      <div className={cn('p-2', isDark ? 'bg-gray-900' : 'bg-sky-50/70')}>
        <p className={cn('truncate text-sm', isDark ? 'text-gray-300' : 'text-slate-700')}>
          {image.file.name}
        </p>
      </div>
    </div>  
  );
}

function ThemeToggle({ isDark, onToggle }: ThemeProps & { onToggle: () => void }) {

  return (
    <div className="mb-4 flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'rounded-full p-3 shadow-lg transition-colors',
          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/90 text-sky-700 shadow-sky-200/60 ring-1 ring-sky-100 hover:bg-sky-50',
        )}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun key="sun" className="theme-mode-icon h-5 w-5 text-yellow-400" />
        ) : (
          <Moon key="moon" className="theme-mode-icon h-5 w-5 text-sky-700" />
        )}
      </button>
    </div>
  );
}

function AppHeader({ isDark }: ThemeProps) {
  return (
    <header className="mb-8 text-center">
      <FileImage className={cn('mx-auto mb-4 h-16 w-16', isDark ? 'text-indigo-400' : 'text-cyan-500')} />
      <h1
        className={cn(
          'mb-2 text-3xl font-semibold leading-tight tracking-normal md:text-4xl',
          isDark ? 'text-sky-100' : 'text-sky-700',
        )}
      >
        Image to PDF Converter
      </h1>
      <p className={isDark ? 'text-gray-400' : 'text-slate-600'}>
        Upload images, reorder them, and convert to a single PDF
      </p>
    </header>
  );
}

function UploadArea({ isDark, onFilesSelected }: ThemeProps & { onFilesSelected: (files: FileList | null) => void }) {
  
  const handleDrop = useCallback(

    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onFilesSelected(event.dataTransfer.files);
    },
    [onFilesSelected],
  );
 
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {

    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}

      className={cn( 
        'cursor-pointer rounded-lg border-[3px] border-dashed p-12 text-center transition-all duration-300',
        isDark
          ? 'border-indigo-500 bg-indigo-950/30 hover:border-indigo-400'
          : 'soft-glass-panel border-cyan-300 bg-cyan-50/45 shadow-inner shadow-sky-100/70 hover:border-sky-500 hover:bg-sky-50/60',
      )}
    >
      <Upload className={cn('mx-auto mb-4 h-12 w-12', isDark ? 'text-indigo-400' : 'text-cyan-500')} />
      <p className={cn('mb-2', isDark ? 'text-gray-300' : 'text-slate-700')}>Drag and drop images here</p>
      <p className={cn('mb-4 text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>or</p>
        
      <label className={cn(
        'animated-blue-gradient inline-block cursor-pointer rounded-lg px-6 py-3 text-white shadow-lg transition-all',
        isDark ? 'shadow-sky-950/40' : 'shadow-sky-200',
      )}>
        Select Images
        <input
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={(event) => onFilesSelected(event.target.files)}
          className="hidden"
        />
      </label>
      
      <p className={cn('mt-4 text-sm', isDark ? 'text-gray-600' : 'text-gray-400')}>
        Supports {ACCEPTED_IMAGE_LABEL}
      </p>
    </div>
  );
}


function ImageList({ images, isDark, isConverting, isClosing, removingImageIds, moveImage, removeImage, clearAll, convertToPDF }: ThemeProps & {
  images: ImageFile[];
  isConverting: boolean;
  isClosing: boolean;
  removingImageIds: Set<string>;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  convertToPDF: () => void;
}) {
  if (images.length === 0) return null;

  return (
    <section className={cn('mt-8', isClosing ? 'smooth-panel-out' : 'smooth-panel-in')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={isDark ? 'text-white' : 'text-slate-950'}>Selected Images ({images.length})</h2>
        <button type="button" onClick={clearAll} className="text-sm text-rose-600 hover:text-rose-700">
          Clear All
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <ImageThumbnail
            key={image.id}
            image={image}
            index={index}
            isRemoving={removingImageIds.has(image.id)}
            moveImage={moveImage}
            removeImage={removeImage}
            isDark={isDark}
          /> 
        ))}
      </div>

      <button
        type="button"
        onClick={convertToPDF}
        disabled={isConverting}
        className={cn(
          'animated-blue-gradient flex w-full items-center justify-center gap-2 rounded-lg py-4 text-white shadow-lg transition-all disabled:animate-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:bg-none disabled:opacity-70 disabled:shadow-none',
          isDark ? 'shadow-sky-950/40' : 'shadow-sky-200',
        )}
      >
        {isConverting ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Converting...
          </>
        ) : (
          <>
            <FileImage className="h-5 w-5" />
            Convert to PDF
          </>
        )}
      </button>
    </section>
  );
}


function DownloadPanel({ isDark, pdfUrl }: ThemeProps & { pdfUrl: string | null }) {
  if (!pdfUrl) return null;

  return (
    <section
      className={cn(
        'smooth-panel-in mt-6 rounded-lg border p-6',
        isDark ? 'border-sky-800 bg-sky-950/40' : 'soft-glass-panel border-cyan-200 bg-cyan-50/65',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={cn('mb-1', isDark ? 'text-sky-300' : 'text-sky-800')}>PDF Ready!</p>
          <p className={cn('text-sm', isDark ? 'text-sky-400' : 'text-sky-600')}>
            Your PDF has been generated successfully
          </p>
        </div>

        <a
          href={pdfUrl}
          download={DOWNLOAD_FILE_NAME}
          className={cn(
            'animated-blue-gradient flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-lg transition-all',
            isDark ? 'shadow-sky-950/40' : 'shadow-sky-200',
          )}
        >
          <Download className="h-5 w-5" />
          Download PDF
        </a>
      </div>
    </section>
  );
}

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isImageListClosing, setIsImageListClosing] = useState(false);
  const [removingImageIds, setRemovingImageIds] = useState<Set<string>>(() => new Set());

  const pageClassName = useMemo(
    () =>
      cn(
        'min-h-screen px-4 py-12 transition-colors',
        isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100',
      ),
    [isDark],
  );

  const imagesRef = useRef<ImageFile[]>([]);
  const pdfUrlRef = useRef<string | null>(null);
  const clearAllTimerRef = useRef<number | null>(null);
  const removeImageTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    pdfUrlRef.current = pdfUrl;
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      if (clearAllTimerRef.current) window.clearTimeout(clearAllTimerRef.current);
      Object.values(removeImageTimersRef.current).forEach((timerId) => window.clearTimeout(timerId));
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files)
      .filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]))
      .map((file) => ({
        id: createImageId(file),
        file,
        preview: URL.createObjectURL(file),
      }));

    if (newImages.length === 0) return;

    if (clearAllTimerRef.current) {
      window.clearTimeout(clearAllTimerRef.current);
      clearAllTimerRef.current = null;
    }
    Object.entries(removeImageTimersRef.current).forEach(([imageId, timerId]) => {
      window.clearTimeout(timerId);
      delete removeImageTimersRef.current[imageId];
    });

    setIsImageListClosing(false);
    setRemovingImageIds(new Set());
    setImages((currentImages) => [...currentImages, ...newImages]);
    setPdfUrl((currentPdfUrl) => {
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      return null;
    });
  }, []);

  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setImages((currentImages) => {
      const reorderedImages = [...currentImages];
      const [draggedImage] = reorderedImages.splice(dragIndex, 1);
      reorderedImages.splice(hoverIndex, 0, draggedImage);
      return reorderedImages;
    });
  }, []);

  const collapseImageList = useCallback(() => {
    if (images.length === 0 || isImageListClosing) return;

    Object.entries(removeImageTimersRef.current).forEach(([imageId, timerId]) => {
      window.clearTimeout(timerId);
      delete removeImageTimersRef.current[imageId];
    });

    setIsImageListClosing(true);
    setRemovingImageIds(new Set());
    setPdfUrl((currentPdfUrl) => {
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      return null;
    });

    clearAllTimerRef.current = window.setTimeout(() => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
      setImages([]);
      setRemovingImageIds(new Set());
      setIsImageListClosing(false);
      clearAllTimerRef.current = null;
    }, 320);
  }, [images.length, isImageListClosing]);

  const removeImage = useCallback((id: string) => {
    if (isImageListClosing || removeImageTimersRef.current[id]) return;

    const activeImageCount = imagesRef.current.length - removingImageIds.size;

    if (activeImageCount <= 1) {
      collapseImageList();
      return;
    }

    setPdfUrl((currentPdfUrl) => {
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      return null;
    });

    setRemovingImageIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(id);
      return nextIds;
    });

    removeImageTimersRef.current[id] = window.setTimeout(() => {
      setImages((currentImages) => {
        const imageToRemove = currentImages.find((image) => image.id === id);
        if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);
        return currentImages.filter((image) => image.id !== id);
      });
      setRemovingImageIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(id);
        return nextIds;
      });
      delete removeImageTimersRef.current[id];
    }, 260);
  }, [collapseImageList, isImageListClosing, removingImageIds.size]);

  const clearAll = useCallback(() => {
    collapseImageList();
  }, [collapseImageList]);

  const convertToPDF = useCallback(async () => {
    if (images.length === 0) return;

    setIsConverting(true);

    try {
      const pdf = new jsPDF();
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (const [pageIndex, image] of images.entries()) {
        const bitmap = await createImageBitmap(image.file);
        const widthRatio = pdfWidth / bitmap.width;
        const heightRatio = pdfHeight / bitmap.height;
        const scale = Math.min(widthRatio, heightRatio);
        const scaledWidth = bitmap.width * scale;
        const scaledHeight = bitmap.height * scale;
        const x = (pdfWidth - scaledWidth) / 2;
        const y = (pdfHeight - scaledHeight) / 2;

        if (pageIndex > 0) pdf.addPage();

        const imageData = await readFileAsDataURL(image.file);
        pdf.addImage(imageData, getPdfImageFormat(image.file), x, y, scaledWidth, scaledHeight);
        bitmap.close();
      }

      const pdfBlob = pdf.output('blob');
      const nextPdfUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl((currentPdfUrl) => {
        if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
        return nextPdfUrl;
      });
    } 
    catch (error) {
      console.error('Error converting to PDF:', error);
      alert('Failed to convert images to PDF. Please try again.');
    } 
    finally {
      setIsConverting(false);
    }
  }, [images]);

  return (
    <DndProvider backend={HTML5Backend}>
      <main className={pageClassName}>
        <div className="mx-auto max-w-4xl">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark((currentTheme) => !currentTheme)} />
          <AppHeader isDark={isDark} />

          <section className={cn('mb-6 rounded-xl p-8 shadow-xl transition-colors', isDark ? 'bg-gray-800' : 'soft-glass-panel bg-white/55 shadow-sky-200/60 ring-1 ring-white/80')}>
            <UploadArea isDark={isDark} onFilesSelected={handleFiles} />
            <ImageList
              images={images}
              isDark={isDark}
              isConverting={isConverting}
              isClosing={isImageListClosing}
              removingImageIds={removingImageIds}
              moveImage={moveImage}
              removeImage={removeImage}
              clearAll={clearAll}
              convertToPDF={convertToPDF}
            />
            <DownloadPanel isDark={isDark} pdfUrl={pdfUrl} />
          </section>

          <footer className={cn('text-center text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
            <p>All processing happens in your browser. No files are uploaded to any server.</p>
          </footer>
        </div>
      </main>
    </DndProvider>
  );
}

export default App;
