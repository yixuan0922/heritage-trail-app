import { useState } from 'react';

interface ThenAndNowSliderProps {
  historicalImage: string;
  modernImage: string;
}

export default function ThenAndNowSlider({ historicalImage, modernImage }: ThenAndNowSliderProps) {
  const [sliderValue, setSliderValue] = useState(50);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseInt(event.target.value));
  };

  return (
    <div className="comparison-slider relative bg-muted rounded-xl overflow-hidden" style={{ height: '300px' }}>
      {/* Historical Image */}
      <img 
        src={historicalImage}
        alt="Historical view" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Modern Image with clip mask */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
      >
        <img 
          src={modernImage}
          alt="Modern view" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Slider Control */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        data-testid="comparison-slider"
      />
      
      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-20"
        style={{ left: `${sliderValue}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
          <i className="fas fa-arrows-left-right text-primary"></i>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white text-xs font-medium rounded-full pointer-events-none">
        Today
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 text-white text-xs font-medium rounded-full pointer-events-none">
        Historical
      </div>
    </div>
  );
}
