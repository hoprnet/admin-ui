import { HTMLAttributes, useEffect, useRef } from 'react';
import md5 from 'md5';
// @ts-ignore
import jazzicon from '@metamask/jazzicon';

interface JazzIconProps extends HTMLAttributes<HTMLDivElement> {
  address: string;
  diameter: number;
}

const JazzIcon = ({ address, diameter, className, ...rest }: JazzIconProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const icon = jazzicon(diameter, md5(address));
    containerRef.current?.appendChild(icon);
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      className={`JazzIcon ${className}`}
      ref={containerRef}
      {...rest}
    />
  );
};

export default JazzIcon;
