import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';

interface VideoSlide {
  id: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  title: string;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : '';
};

// Get high-quality thumbnail URL with fallback options
const getThumbnailUrl = (videoId: string, quality: 'sd' | 'hq' | 'mq' = 'sd'): string => {
  // sddefault (640x480) is more reliable than maxresdefault
  // and provides good quality for most videos
  const qualityMap = {
    sd: 'sddefault',   // 640x480 - good quality, always available
    hq: 'hqdefault',   // 480x360 - high quality, always available
    mq: 'mqdefault',   // 320x180 - medium quality, always available
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

interface VideoCarouselProps {
  videos?: { url: string; title: string }[];
  autoPlayInterval?: number;
}

export const VideoCarousel: React.FC<VideoCarouselProps> = ({
  videos = [
    { url: 'https://youtu.be/K_cLZlI0Cl4?si=Rso6AqrR7B3XkabB', title: 'Physics Lecture Demo' },
    { url: 'https://youtu.be/7cbm-vcRAmk?si=1QblcQ8NCaHn4x6u', title: 'Biology Lecture Demo' },
  ],
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Process videos into slides
  const slides: VideoSlide[] = videos.map((video) => {
    const videoId = getYouTubeId(video.url);
    return {
      id: videoId,
      youtubeUrl: video.url,
      thumbnailUrl: getThumbnailUrl(videoId),
      title: video.title,
    };
  });

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlayInterval, isHovered, goToNext]);

  const handleVideoClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Carousel Container */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl md:rounded-[2rem] overflow-hidden border border-white/10 bg-[#000]/60 shadow-[0_0_100px_-20px_rgba(79,70,229,0.2)] group">
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-gray-900/50 to-emerald-950/40"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)', 
            backgroundSize: '40px 40px'
          }}
        />

        {/* Slides */}
        <div className="relative w-full h-full overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                index === currentIndex
                  ? 'opacity-100 scale-100 translate-x-0'
                  : index < currentIndex
                  ? 'opacity-0 scale-95 -translate-x-full'
                  : 'opacity-0 scale-95 translate-x-full'
              }`}
            >
              {/* Thumbnail Image */}
              <div 
                className="absolute inset-0 cursor-pointer group/slide"
                onClick={() => handleVideoClick(slide.youtubeUrl)}
              >
                <img
                  src={slide.thumbnailUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/slide:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try hqdefault as fallback, which is always available
                    if (!target.src.includes('hqdefault')) {
                      target.src = `https://img.youtube.com/vi/${slide.id}/hqdefault.jpg`;
                    }
                  }}
                />
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 group-hover/slide:from-black/70 transition-all duration-300" />
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative group/play">
                    {/* Pulse Ring */}
                    <div className="absolute inset-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 animate-ping opacity-75 -m-2" />
                    
                    {/* Main Button */}
                    <button className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-white to-gray-200 flex items-center justify-center shadow-2xl shadow-black/50 group-hover/slide:scale-110 transition-transform duration-300">
                      <Play 
                        size={24} 
                        className="text-indigo-900 ml-1 md:w-7 md:h-7" 
                        fill="currentColor" 
                      />
                    </button>
                  </div>
                </div>

                {/* Video Title */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 md:h-6 bg-gradient-to-b from-indigo-500 to-green-500 rounded-full" />
                    <span className="text-xs md:text-sm font-mono text-white/60 uppercase tracking-wider">
                      Demo Lecture
                    </span>
                  </div>
                  <h3 className="text-lg md:text-2xl font-display font-bold text-white group-hover/slide:text-indigo-200 transition-colors">
                    {slide.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover/slide:opacity-100 transition-opacity">
                    <span className="text-xs md:text-sm text-white/70">Watch on YouTube</span>
                    <ExternalLink size={14} className="text-white/70" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20"
          aria-label="Next slide"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-6 md:w-8 h-2 bg-gradient-to-r from-indigo-500 to-green-500'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / slides.length) * 100}%`,
            }}
          />
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24 pointer-events-none">
          <div className="absolute top-2 left-2 md:top-4 md:left-4 w-8 h-8 md:w-12 md:h-12 border-l-2 border-t-2 border-indigo-500/30 rounded-tl-lg" />
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 pointer-events-none">
          <div className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-12 md:h-12 border-r-2 border-t-2 border-green-500/30 rounded-tr-lg" />
        </div>
        <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 pointer-events-none">
          <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-8 h-8 md:w-12 md:h-12 border-l-2 border-b-2 border-indigo-500/30 rounded-bl-lg" />
        </div>
        <div className="absolute bottom-0 right-0 w-16 h-16 md:w-24 md:h-24 pointer-events-none">
          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-12 md:h-12 border-r-2 border-b-2 border-green-500/30 rounded-br-lg" />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center gap-3 md:gap-6 px-4 py-1.5 md:py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] md:text-[10px] text-indigo-300 font-mono">JEE Ready</span>
          </div>
          <div className="w-px h-3 bg-white/20"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] md:text-[10px] text-white/60 font-display font-semibold">Demo Lectures</span>
          </div>
          <div className="w-px h-3 bg-white/20"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] md:text-[10px] text-emerald-300 font-mono">NEET Ready</span>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
