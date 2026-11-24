import type { SVGAttributes } from 'react';
import { BrandMarkIcon } from '@/components/brand-mark-icon';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({ className, ...props }: SVGAttributes<SVGElement>) {
    return <BrandMarkIcon tone="color" className={cn('h-7 w-7 sm:h-8 sm:w-8', className)} {...props} />;
}
