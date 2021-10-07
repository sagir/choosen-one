export interface Axis {
  x: number;
  y: number;
}

export interface Ball {
  radius: number;
  pos: Axis;
}

export interface Player extends Ball {
  name: string;
  id: number;
  dir: Axis;
}
