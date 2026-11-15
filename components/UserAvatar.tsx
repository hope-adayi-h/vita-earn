"use client";

import { useApp } from "@/context/AppContext";

interface UserAvatarProps {
  initial: string;
  className?: string;
}

export function UserAvatar({ initial, className = "w-12 h-12 sm:w-14 sm:h-14" }: UserAvatarProps) {
  const { avatar } = useApp();

  return (
    <div
      className={`${className} rounded-full aspect-square overflow-hidden border border-white/30 flex items-center justify-center shadow-inner shrink-0 bg-white/20 backdrop-blur-md`}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-black text-xl sm:text-2xl">{initial}</span>
      )}
    </div>
  );
}
