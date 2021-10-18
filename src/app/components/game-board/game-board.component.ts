import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, ViewChild, ɵɵsetComponentScope } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Ball, Player } from 'src/app/models/player.model';
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
  private ball!: Ball;
  private interval: any = null;

  private winner?: Player;

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

    // this.ball.pos.x = this.canvas.width / 2 - this.ball.radius;
    // this.ball.pos.y = this.canvas.height / 2 - this.ball.radius;
    this.playersService.updateBoundary(this.canvas.height, this.canvas.width);
  }

  public ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    const parent = this.canvas.parentElement as HTMLElement;
    this.parent = parent.parentElement as HTMLDivElement;

    this.playersService.ball$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(ball => this.ball = ball)

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
        this.players.forEach(player => {
          if (!playerId) {
            player.opacity = .75;
          } else if (playerId == player.id) {
            player.opacity = 1;
          } else {
            player.opacity = .25;
          }
        });

        this.redraw();
      });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBall();
    this.players.forEach(player => this.drawPlayer(player));
  }

  private drawBall() {
    this.ctx.beginPath();
    this.ctx.arc(this.ball.pos.x, this.ball.pos.y, this.ball.radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = this.ball.color;
    this.ctx.globalAlpha = 1;
    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.font = '20px Quicksand';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = "green";
    this.ctx.fillText(this.ball.name, this.canvas.width / 2, this.canvas.height / 2 + 10);
    this.ctx.restore();
  }

  private drawPlayer({ pos, radius, color, opacity }: Player): void {
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = opacity;

    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }

  public play() {
    if (this.animationFrameId) {
      this.window.cancelAnimationFrame(this.animationFrameId);
      this.playersService.updateBallName('Click to play');
      this.animationFrameId = null;
      this.redraw();
      return;
    }

    const callback = () => {
      let isTouching: boolean;

      if (this.winner) return;

      for (let player of this.players) {
        isTouching = this.playersService.resolveCollision(player, this.ball);

        if (this.ball.touchable && isTouching && !this.winner) {
          this.winner = player;
          this.playersService.updateBallName(this.winner.name);
          this.animationFrameId && this.window.cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
          this.redraw();
          this.beginWinnerAnimation();
          break;
        }
      }

      // this.players.forEach((player) => {
      //   const isTouching = this.playersService.resolveCollision(player, this.ball);

      //   if (this.ball.touchable && isTouching && !this.winner) {
      //     this.winner = player;
      //     this.playersService.updateBallName(this.winner.name);
      //     this.animationFrameId && this.window.cancelAnimationFrame(this.animationFrameId);
      //     this.animationFrameId = null;
      //     this.redraw();
      //     this.beginWinnerAnimation();
      //     return;
      //   }
      // });
      this.redraw();
      this.animationFrameId = this.window.requestAnimationFrame(callback);
    };

    this.animationFrameId = this.window.requestAnimationFrame(callback);
    this.beginTick();
  }

  private beginTick(timeout: number = 10): void {
    this.endTick();

    this.playersService.updateBallName(`${timeout} Seconds`);

    this.interval = this.window.setInterval(() => {
      this.playersService.updateBallName(`${--timeout} Seconds`);

      if (timeout <= 0) {
        this.playersService.markBallAsTouchable();
        this.endTick();
      }
    }, 1000);
  }

  private endTick(): void {
    this.interval && this.window.clearInterval(this.interval);
  }

  private beginWinnerAnimation() {
    if (this.animationFrameId) {
      this.window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      return;
    }

    const callback = () => {
      this.explodeBalls();
      this.redraw();
      this.animationFrameId = this.window.requestAnimationFrame(callback);
    }

    this.animationFrameId = this.window.requestAnimationFrame(callback);
  }

  private explodeBalls() {
    this.players.forEach(player => {
      if (player !== this.winner) {
        if (player.opacity <= 0) {
          player.opacity = 0;
        } else {
          player.radius += .25;
          player.opacity -= .01;
        }
      }

      return player;
    })
  }

}
