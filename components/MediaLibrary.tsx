import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Check, Loader2 } from 'lucide-react';
import { uploadToFirebaseStorage } from '../services/storageService';

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (url: string) => void;
  darkMode: boolean;
  images?: {id: string, url: string, name: string}[];
  setImages?: (images: {id: string, url: string, name: string}[]) => void;
  onDeleteImage?: (id: string) => void;
  storageMode?: 'local' | 'firebase';
  currentUser?: import('../types').User | null;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({ isOpen, onClose, onSelect, darkMode, images: propsImages, setImages: propsSetImages, onDeleteImage, storageMode, currentUser }) => {
  const [internalImages, setInternalImages] = useState<{id: string, url: string, name: string}[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000', name: 'Office Space' },
    { id: '2', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000', name: 'Team Collaboration' },
    { id: '3', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000', name: 'Tech Setup' },
  ]);
  
  const images = propsImages || internalImages;
  const setImages = propsSetImages || setInternalImages;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        let url = '';
        const id = Math.random().toString(36).substr(2, 9);
        
        if (storageMode === 'firebase' && currentUser) {
          url = await uploadToFirebaseStorage(file, `users/${currentUser.id}/media/${id}_${file.name}`);
        } else {
          url = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newImage = {
          id,
          url,
          name: file.name
        };
        setImages([newImage, ...images]);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteImage) {
      onDeleteImage(id);
    } else {
      setImages(images.filter(img => img.id !== id));
    }
    if (selectedId === id) setSelectedId(null);
  };

  const handleConfirm = () => {
    if (selectedId && onSelect) {
      const img = images.find(i => i.id === selectedId);
      if (img) onSelect(img.url);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-4xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <h2 className="text-2xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-blue-500" /> Media Library</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-500 dark:text-gray-400">Select an image or upload a new one.</p>
            <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 px-4 py-2 rounded-xl font-bold transition flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <div 
                key={img.id}
                onClick={() => setSelectedId(img.id)}
                className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all aspect-square ${selectedId === img.id ? 'border-blue-500 shadow-md scale-[0.98]' : darkMode ? 'border-gray-800 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${selectedId === img.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {selectedId === img.id && (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <Check className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => handleDelete(img.id, e)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs truncate">
                  {img.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
          <button onClick={onClose} className="px-6 py-2 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition">Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedId && !!onSelect}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-8 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/20"
          >
            {onSelect ? 'Select Image' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
