import { useRouter } from 'next/navigation';

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
        <img
          src="/box.svg"
          alt={`Box ${boxCode}`}
          className={`w-40 h-40 transition-colors duration-200 ${
            isAvailable ? 'opacity-100' : 'opacity-50'
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">{boxCode}</span>
    </div>
  );
} 