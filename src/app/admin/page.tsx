'use client';

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

interface FormData {
  titleJapanese: string;
  titleEnglish: string;
  artistJapanese: string;
  artistEnglish: string;
  lyrics: string;
  romaji: string;
  youtubeUrl: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{ status: string; progress?: number } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    titleJapanese: "",
    titleEnglish: "",
    artistJapanese: "",
    artistEnglish: "",
    lyrics: "",
    romaji: "",
    youtubeUrl: ""
  });
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const youtubeSearchTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setDownloadStatus(null);

    try {
      if (!formData.titleJapanese || !formData.titleEnglish || 
          !formData.artistJapanese || !formData.artistEnglish || 
          !formData.lyrics || !formData.romaji || !selectedImage) {
        throw new Error('All fields are required');
      }

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        formDataToSend.append('artwork', file);
      }

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save song');
      }

      // Start polling for download status
      const songId = data.songId;
      let isDownloading = true;
      
      while (isDownloading) {
        const statusResponse = await fetch(`/api/songs/${songId}/audio/status`);
        const statusData = await statusResponse.json();
        
        setDownloadStatus(statusData);
        
        if (statusData.status === 'ready') {
          isDownloading = false;
          router.push(`/songs/${songId}`);
        } else if (statusData.status === 'error') {
          throw new Error(`Audio download failed: ${statusData.error?.message || 'Unknown error'}`);
        } else {
          // Wait 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const searchYoutube = async () => {
      if (!formData.titleJapanese || !formData.artistJapanese || formData.youtubeUrl || isSearchingYoutube) {
        return;
      }
      
      setIsSearchingYoutube(true);
      try {
        const query = `${formData.titleJapanese} ${formData.artistJapanese}`;
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.url) {
          setFormData(prev => ({
            ...prev,
            youtubeUrl: data.url
          }));
        }
      } catch (error) {
        console.error('Error searching YouTube:', error);
      } finally {
        setIsSearchingYoutube(false);
      }
    };

    // Clear existing timer
    if (youtubeSearchTimerRef.current) {
      clearTimeout(youtubeSearchTimerRef.current);
    }

    // Set new timer to debounce the search
    youtubeSearchTimerRef.current = setTimeout(() => {
      searchYoutube();
    }, 1000); // Wait 1 second after last input change

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (youtubeSearchTimerRef.current) {
        clearTimeout(youtubeSearchTimerRef.current);
      }
    };
  }, [formData.titleJapanese, formData.artistJapanese, formData.youtubeUrl, isSearchingYoutube]);

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

      {downloadStatus && downloadStatus.status !== 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="capitalize">
                {downloadStatus.status === 'pending' ? 'Preparing download...' : 'Downloading audio...'}
              </span>
              {downloadStatus.progress && (
                <span>{Math.round(downloadStatus.progress)}%</span>
              )}
            </div>
            {downloadStatus.progress && (
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadStatus.progress}%` }}
                />
              </div>
            )}
          </div>
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

        <div className="col-span-full">
          <label className="block text-sm font-medium mb-1">YouTube URL</label>
          <div className="flex gap-2">
            <input
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleInputChange}
              className="flex-1 p-2 rounded border dark:bg-gray-800 dark:border-gray-700"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {formData.youtubeUrl && (
              <button
                type="button"
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => setFormData(prev => ({ ...prev, youtubeUrl: "" }))}
              >
                Clear
              </button>
            )}
          </div>
          {formData.youtubeUrl && (
            <div className="mt-2 aspect-video rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${new URL(formData.youtubeUrl).searchParams.get('v')}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
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
          <div className="flex flex-col items-center gap-4 w-full">
            {selectedImage ? (
              <div className="w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt="Selected artwork"
                  className="w-full h-auto object-cover aspect-square"
                />
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
                className="w-full h-64 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
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