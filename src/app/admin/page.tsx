'use client';

import { useState, useRef, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface FormData {
  titleJapanese: string;
  titleEnglish: string;
  artistJapanese: string;
  artistEnglish: string;
  lyrics: string;
  romaji: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [formData, setFormData] = useState<FormData>({
    titleJapanese: "",
    titleEnglish: "",
    artistJapanese: "",
    artistEnglish: "",
    lyrics: "",
    romaji: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        // Reset crop when new image is selected
        setCrop({
          unit: '%',
          x: 0,
          y: 0,
          width: 100,
          height: 100
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.titleJapanese || !formData.titleEnglish || 
          !formData.artistJapanese || !formData.artistEnglish || 
          !formData.lyrics || !formData.romaji || !selectedImage) {
        throw new Error('All fields are required');
      }

      // Get cropped image
      if (!imgRef.current) {
        throw new Error('No image selected');
      }

      const croppedBlob = await getCroppedImg(imgRef.current, crop);
      const croppedFile = new File([croppedBlob], fileInputRef.current?.files?.[0]?.name || 'artwork.jpg', {
        type: 'image/jpeg'
      });

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('artwork', croppedFile);

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save song');
      }

      const { songId } = await response.json();
      router.push(`/songs/${songId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Add New Song</h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title (Japanese)</label>
            <input
              name="titleJapanese"
              value={formData.titleJapanese}
              onChange={handleInputChange}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title (English)</label>
            <input
              name="titleEnglish"
              value={formData.titleEnglish}
              onChange={handleInputChange}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Artist (Japanese)</label>
            <input
              name="artistJapanese"
              value={formData.artistJapanese}
              onChange={handleInputChange}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Artist (English)</label>
            <input
              name="artistEnglish"
              value={formData.artistEnglish}
              onChange={handleInputChange}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">Artwork</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-4">
            {selectedImage ? (
              <div className="w-full max-w-md">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  aspect={1}
                  circularCrop={false}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={selectedImage}
                    alt="Selected artwork"
                    className="max-w-full h-auto"
                  />
                </ReactCrop>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div
                onClick={handleUploadClick}
                className="w-full max-w-md h-64 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <div className="text-center">
                  <p>Click to upload</p>
                  <p className="text-sm text-gray-500">JPG, PNG, GIF up to 5MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Lyrics (Japanese)
            </label>
            <textarea
              name="lyrics"
              value={formData.lyrics}
              onChange={handleInputChange}
              rows={10}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 font-mono"
              placeholder="Paste Japanese lyrics here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Lyrics (Romaji)
            </label>
            <textarea
              name="romaji"
              value={formData.romaji}
              onChange={handleInputChange}
              rows={10}
              className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 font-mono"
              placeholder="Enter romaji lyrics here..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Saving...
            </>
          ) : (
            'Save Song'
          )}
        </button>
      </div>
    </form>
  );
}