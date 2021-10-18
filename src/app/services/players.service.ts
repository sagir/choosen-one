import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Player, Axis, Ball } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private readonly colors: string[] = [
    '#f1c40f', '#f39c12', '#e67e22','#d35400',
    '#3498db', '#2980b9', '#9b59b6', '#8e44ad',
    '#1abc9c', '#16a085'
  ];

  private readonly defaultRadius = 10;
  private width: number = 0;
  private height: number = 0;

  private _hoveredPlayerId$: Subject<number | null> = new Subject();
  public hoveredPlayerId$: Observable<number | null>;

  private max = 1;
  private _players$: BehaviorSubject<Player[]> = new BehaviorSubject(([] as Player[]));
  public readonly players$: Observable<Player[]>;

  private _ball$: BehaviorSubject<Ball> = new BehaviorSubject({
    color: '#e74c3c',
    name: 'Click to play',
    radius: 100,
    pos: { x: 1, y: 1 },
  });
  public readonly ball$: Observable<Ball>;

  constructor() {
    this.hoveredPlayerId$ = this._hoveredPlayerId$.asObservable();
    this._hoveredPlayerId$.next(null);
    this.players$ = this._players$.asObservable();
    this.ball$ = this._ball$.asObservable();
  }

  public add(name: string): void {
    const players = this._players$.value;
    const randomDir = this.randomBetween(2, 5);
    const randomDirX = this.randomBetween(1, 3) > 1 ? 1 : -1;
    const randomDirY = this.randomBetween(1, 3) > 1 ? 1 : -1;

    players.push({
      color: this.colors[this.randomBetween(0, this.colors.length)],
      name,
      id: this.max,
      radius: this.defaultRadius,
      pos: this.getPosition(players),
      opacity: .75,
      dir: {
        x: randomDir * randomDirX,
        y: (6 - randomDir) * randomDirY
      }
    });

    this.max++;
    this._players$.next(players);
  }

  private getPosition(players: Player[], radius: number = this.defaultRadius): Axis {
    let pos: Axis = {
      x: this.randomBetween(radius * 2, this.width) - radius,
      y: this.randomBetween(radius * 2, this.height) - radius
    };

    while(
      this.detectCollision(
        { pos, radius, name: '', color: '' },
        [...players, this._ball$.value]
      )
    ) {
      pos = this.getPosition(players, radius);
    }

    return pos;
  }

  private randomBetween(start: number, stop: number): number {
    return  Math.floor(Math.random() * (stop - start) + start);
  }

  public remove(playerId: number): void {
    const players = this._players$.value;
    const player = players.find(({ id }) => id === playerId);

    if (!player) return;

    const index = players.indexOf(player);
    players.splice(index, 1);
    this._players$.next(players);
  }

  public detectCollision({ pos, radius }: Ball, players: Ball[], currentPlayer?: Player): boolean {
    let dist: number,
        distX: number,
        distY: number,
        minDist: number;

    for (let player of players) {
      if (player === currentPlayer) {
        continue;
      }

      distX = Math.abs(pos.x - player.pos.x);
      distY = Math.abs(pos.y - player.pos.y);
      minDist = radius + player.radius;

      if (distX > minDist || distY > minDist) {
        continue;
      }

      dist = Math.round(Math.sqrt((distX * distX) + (distY * distY)));

      if (dist <= minDist) {
        return true;
      }
    }

    return false;
  }

  private rotateBall({ x, y }: Axis, angle: number): Axis {
    return {
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle)
    };
  }

  public resolveCollision(player: Player, ball: Ball): boolean {
    const pos1 = player.pos,
          pos2 = ball.pos,
          dir = player.dir;

    pos1.x = pos1.x + dir.x;
    pos1.y = pos1.y + dir.y;

    // boundary collision x
    if (pos1.x <= player.radius || pos1.x + player.radius >= this.width) {
      dir.x = dir.x * -1;
    }

    // boundary collision y
    if (pos1.y <= player.radius || pos1.y + player.radius >= this.height) {
      dir.y = dir.y * -1;
    }

    const isTouching = this.detectCollision(player, [ball]);

    if (isTouching) {
      if (dir.x * (pos2.x - pos1.x) + dir.y * (pos2.y - pos1.y) >= 0) {
        const angle = -Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
        const rotatedDir = this.rotateBall(dir, angle);
        const swappedVelocity = { x: rotatedDir.x * -1, y: rotatedDir.y };
        const resultVelocity = this.rotateBall(swappedVelocity, -angle);
        dir.x = resultVelocity.x;
        dir.y = resultVelocity.y;
      }
    }

    return isTouching;
  }

  public shuffle(): void {
    this._players$.next(this._players$.value.sort(() => .5 - Math.random()));
    this.relocatePlayers();
  }

  private relocatePlayers(): void {
    this._players$.next(
      this._players$.value.map(player => {
        player.pos = { x: 1, y: 1 };
        return player;
      }).map((player, index, players) => {
        player.pos = this.getPosition(players, player.radius);
        return player;
      })
    );
  }

  public updateBoundary(height: number, width: number): void {
    this.height = height;
    this.width = width;
    this.updateBallPosition();
  }

  private updateBallPosition(): void {
    const ball = this._ball$.value;

    ball.pos = {
      x: this.width / 2,
      y: this.height / 2
    };

    this._ball$.next(ball);
  }

  public updateBallName(name: string): void {
    this._ball$.next({
      ...this._ball$.value,
      name
    });
  }

  public markBallAsTouchable(): void {
    this._ball$.next({
      ...this._ball$.value,
      color: '#fff',
      name: '',
      touchable: true
    });
  }

  public markBallAsUntouchable(): void {
    this._ball$.next({
      ...this._ball$.value,
      color: '#e74c3c',
      name: 'Click to play',
      touchable: false
    });
  }

  public onHover(playerId: number | null): void {
    this._hoveredPlayerId$.next(playerId);
  }
}
