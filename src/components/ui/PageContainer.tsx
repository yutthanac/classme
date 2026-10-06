import React from 'react';
import { cn } from '@/lib/cn';

/** Full-width page shell for every view inside <main>. */
export function PageContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full min-h-full p-4 sm:p-6 xl:p-8 space-y-6', className)} {...props}>
      {children}
    </div>
  );
}

export default PageContainer;
