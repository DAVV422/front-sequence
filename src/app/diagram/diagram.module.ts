import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteComponent } from './palette/palette.component';
import { GojsAngularModule } from 'gojs-angular';
import { DiagramComponent } from './diagram/diagram.component';
import { InspectorComponent } from './inspector/inspector.component';
import { InspectorRowComponent } from './inspector-row/inspector-row.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    PaletteComponent,
    DiagramComponent,
    InspectorComponent,
    InspectorRowComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    GojsAngularModule
  ],
  exports: [
    PaletteComponent,
    DiagramComponent
  ]
})
export class DiagramModule { }
