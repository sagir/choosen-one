import { Component, OnInit } from '@angular/core';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-add-name',
  templateUrl: './add-name.component.html',
  styleUrls: ['./add-name.component.scss']
})
export class AddNameComponent implements OnInit {
  public name: string = '';

  constructor(
    private playersService: PlayersService
  ) { }

  public ngOnInit(): void {
  }

  public addName($event: Event) {
    $event.preventDefault();

    if (this.name) {
      this.name.split(' ').forEach(name => this.playersService.add(name))
      this.name = '';
    }
  }

}
