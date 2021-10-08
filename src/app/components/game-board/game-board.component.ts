import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Player } from 'src/app/models/player.model';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnDestroy, AfterViewInit {
  private ngUnsubscribe = new Subject();

  @ViewChild('canvasRef') private canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;
  private parent!: HTMLDivElement;
  private ctx!: CanvasRenderingContext2D;
  private window!: Window;
  private players!: Player[];
  private playerId: number | null = null;
  private animationFrameId: number | null = null;

  constructor(
    private playersService: PlayersService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.window = this.document.defaultView as Window;
    this.window.addEventListener('load', () => this.onResize())
    this.window.addEventListener('resize', () => this.onResize())
  }

  private onResize() {
    this.canvas.width = this.parent.clientWidth;
    this.canvas.height = this.parent.clientHeight;

    this.playersService.updateBoundary(this.canvas.height, this.canvas.width);
  }

  public ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    const parent = this.canvas.parentElement as HTMLElement;
    this.parent = parent.parentElement as HTMLDivElement;

    this.playersService.players$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(players => {
        this.players = JSON.parse(JSON.stringify(players));
        this.redraw();
      });

    this.playersService.hoveredPlayerId$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((playerId: number | null) => {
        this.playerId = playerId;
        this.redraw();
      });

    this.play();
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.players.forEach(player => this.drawPlayer(player));
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private drawPlayer({ pos, radius, id }: Player): void {
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    if (this.playerId === id) {
      this.ctx.fillStyle = "red";
      this.ctx.fill();
    }
  }

  private play() {
    const callback = () => {
      this.players.forEach((player) => {
        if (
          player.pos.x - player.radius <= 0 ||
          player.pos.x + player.radius >= this.canvas.width
        ) {
          player.dir.x = player.dir.x * -1;
        }

        if (
          player.pos.y - player.radius <= 0 ||
          player.pos.y + player.radius >= this.canvas.height
        ) {
          player.dir.y = player.dir.y * -1;
        }

        player.pos.x += player.dir.x / 60;
        player.pos.y += player.dir.y / 60;
      });

      this.redraw();
      this.animationFrameId = requestAnimationFrame(callback);
    };

    this.animationFrameId = requestAnimationFrame(callback);
  }

}
