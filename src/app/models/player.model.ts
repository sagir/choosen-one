export interface Axis {
  x: number;
  y: number;
}

export interface Ball {
  color: string;
  name: string;
  radius: number;
  pos: Axis;
  touchable?: boolean;
}

export interface Player extends Ball {
  name: string;
  id: number;
  dir: Axis;
  opacity: number;
}
