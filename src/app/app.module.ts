import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AddNameComponent } from './components/add-name/add-name.component';
import { NameListComponent } from './components/name-list/name-list.component';
import { FooterActionsComponent } from './components/footer-actions/footer-actions.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    AddNameComponent,
    NameListComponent,
    FooterActionsComponent,
    GameBoardComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
