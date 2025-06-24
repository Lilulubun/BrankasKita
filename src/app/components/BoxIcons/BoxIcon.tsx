// src/app/components/BoxIcons/BoxIcon.tsx
'use client';

// STEP 1: Import the Next.js Image component
import Image from 'next/image';

interface BoxIconProps {
  id: string;
  status: string;
  boxCode: string;
  onAvailable: (id: string) => void;
  onUnavailable: () => void;
}

export default function BoxIcon({ id, status, boxCode, onAvailable, onUnavailable }: BoxIconProps) {
  const isAvailable = status === 'available';

  const handleClick = () => {
    if (isAvailable) {
      onAvailable(id);
    } else {
      onUnavailable();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative group cursor-pointer" onClick={handleClick}>
        {/* STEP 2: Replace the standard <img> tag with the <Image> component 
          and add the required width and height props.
          The className w-40 h-40 corresponds to 160px by 160px.
        */}
        <Image
          src="/box.svg"
          alt={`Box ${boxCode}`}
          width={160}
          height={160}
          className={`transition-colors duration-200 ${
            isAvailable ? 'opacity-100' : 'opacity-50'
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">{boxCode}</span>
    </div>
  );
}
