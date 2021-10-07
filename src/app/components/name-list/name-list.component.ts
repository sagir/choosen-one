import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Player } from 'src/app/models/player.model';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-name-list',
  templateUrl: './name-list.component.html',
  styleUrls: ['./name-list.component.scss']
})
export class NameListComponent implements OnInit, OnDestroy {
  public players!: Player[];
  private ngUnsubscribe = new Subject();

  constructor(
    private playersService: PlayersService
  ) { }

  public ngOnInit(): void {
    this.playersService.players$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(players => this.players = players);
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public trackPlayerBy(index: number, player: Player): number {
    return player.id;
  }

  public removeName(id: number): void {
    this.playersService.remove(id);
  }

  public onHover(value: number | null): void {
    this.playersService.onHover(value);
  }

}
