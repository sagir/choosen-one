import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Player, Axis } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class PlayersService {
  private readonly defaultRadius = 10;
  private width: number = 0;
  private height: number = 0;

  private _hoveredPlayerId$: Subject<number | null> = new Subject();
  public hoveredPlayerId$: Observable<number | null>;

  private max = 1;
  private _players$: BehaviorSubject<Player[]> = new BehaviorSubject(([] as Player[]));
  public players$: Observable<Player[]>;

  constructor() {
    this.hoveredPlayerId$ = this._hoveredPlayerId$.asObservable();
    this._hoveredPlayerId$.next(null);
    this.players$ = this._players$.asObservable();
  }

  public add(name: string): void {
    const players = this._players$.value;

    players.push({
      name,
      id: this.max,
      radius: this.defaultRadius,
      pos: this.getPosition(players),
      dir: {
        x: this.randomBetween(-200, 200),
        y: this.randomBetween(-200, 200)
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

    while(this.detectCollision(pos, radius, players)) {
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

  private detectCollision(pos: Axis, radius: number, players: Player[], currentPlayer?: Player): boolean {
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
  }

  public onHover(playerId: number | null): void {
    this._hoveredPlayerId$.next(playerId);
  }
}
