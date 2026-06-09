'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends Omit<ImageProps, 'src'> {
    src: string | null | undefined;
    fallbackType?: 'player' | 'club';
}

export function SafeImage({ src, fallbackType = 'player', className, alt, ...props }: SafeImageProps) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={cn("flex w-full h-full items-center justify-center bg-zinc-800 text-zinc-500 rounded-md", className)}>
                {fallbackType === 'player' ? (
                    <User className="w-1/2 h-1/2 opacity-50" />
                ) : (
                    <Shield className="w-1/2 h-1/2 opacity-50" />
                )}
            </div>
        );
    }

    if (typeof src === 'string' && src.startsWith('data:')) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                className={cn("w-full h-full", className)}
                alt={alt || "Image"}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <Image
            src={src}
            className={className}
            alt={alt || "Image"}
            onError={() => setError(true)}
            {...props}
        />
    );
}
