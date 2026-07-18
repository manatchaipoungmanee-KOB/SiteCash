/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PPLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: 'dark' | 'white';
}

export default function PPLogo({ variant = 'horizontal', size = 'md', textColor = 'dark' }: PPLogoProps) {
  // Color configuration: exact deep royal blue from the company logo, or white for dark backgrounds
  const logoColor = textColor === 'white' ? '#ffffff' : '#1d318e';
  const lineColor = textColor === 'white' ? 'rgba(255, 255, 255, 0.4)' : '#1d318e';

  const textThemeColor = textColor === 'white' ? 'text-white' : 'text-slate-800';
  const subTextThemeColor = textColor === 'white' ? 'text-slate-300' : 'text-slate-500';

  if (variant === 'icon') {
    return null;
  }

  if (variant === 'vertical') {
    return (
      <div className="flex flex-col items-center text-center space-y-1 select-none w-full">
        <h2 className={`font-sans font-extrabold tracking-wider uppercase leading-tight ${textThemeColor} text-sm sm:text-base md:text-lg lg:text-xl`}>
          PP. CONSTRUCTION AND MANAGEMENT CO., LTD
        </h2>
        <div className="border-t-2 w-full max-w-md my-1.5" style={{ borderColor: lineColor }} />
        <p className={`font-sans font-semibold tracking-wide leading-snug ${subTextThemeColor} text-xs sm:text-sm md:text-base`}>
          บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด
        </p>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className="flex flex-col justify-center select-none max-w-full">
      <h2 className={`font-sans font-extrabold tracking-wider uppercase leading-tight ${textThemeColor} text-[11px] sm:text-[13px] md:text-sm lg:text-base`}>
        PP. CONSTRUCTION AND MANAGEMENT CO., LTD
      </h2>
      <div className="border-t w-full my-0.5 sm:my-1" style={{ borderColor: lineColor }} />
      <p className={`font-sans font-medium tracking-wide leading-none ${subTextThemeColor} text-[9px] sm:text-[10px] md:text-xs`}>
        บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด
      </p>
    </div>
  );
}
