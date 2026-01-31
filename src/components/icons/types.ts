export interface AnimatedIconHandle {
  startAnimation: () => Promise<void>;
  stopAnimation: () => Promise<void>;
}

export interface AnimatedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  isHovered?: boolean;
}
