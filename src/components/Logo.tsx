import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36 sm:w-44 sm:h-44',
    lg: 'w-52 h-52 sm:w-60 sm:h-60',
    xl: 'w-72 h-72 sm:w-96 sm:h-96',
  };

  const formats = ['/logo.png', '/logo.jpg', '/logo.jpeg', '/logo.webp', '/logo.svg'];
  const [currentFormatIndex, setCurrentFormatIndex] = useState(0);

  // If the index changes, update image source. Reset if the component is remounted.
  const handleImageError = () => {
    if (currentFormatIndex < formats.length - 1) {
      setCurrentFormatIndex(prev => prev + 1);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      <img 
        src={formats[currentFormatIndex]} 
        alt="Alana & Henderson Logo" 
        className="w-full h-full object-cover rounded-full mix-blend-multiply opacity-95 transition-all duration-300"
        style={{
          maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 48%, rgba(0,0,0,0) 68%)',
          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 48%, rgba(0,0,0,0) 68%)',
        }}
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
}
