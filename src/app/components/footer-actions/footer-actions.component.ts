import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-footer-actions',
  templateUrl: './footer-actions.component.html',
  styleUrls: ['./footer-actions.component.scss']
})
export class FooterActionsComponent implements OnInit {

  constructor(
    private playersService: PlayersService
  ) { }

  public ngOnInit(): void {
  }

  public shuffle(): void {
    this.playersService.shuffle();
  }

}
