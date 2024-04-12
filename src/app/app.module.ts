import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GojsAngularModule } from 'gojs-angular';
import { DiagramModule } from './diagram/diagram.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DiagramModule,
    GojsAngularModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
