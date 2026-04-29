import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Room } from '@/context/AppContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRoomLabel(rooms: Room[], roomNumber?: number | null) {
  if (roomNumber == null) {
    return 'General work';
  }

  const room = rooms.find((item) => item.number === roomNumber);
  if (!room) {
    return `Room ${roomNumber}`;
  }

  return room.name;
}
