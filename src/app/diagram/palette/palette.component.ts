import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import * as go from 'gojs';

import { DataSyncService, PaletteComponent as Palette } from 'gojs-angular';

@Component({
  selector: 'diagram-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class PaletteComponent {

  @ViewChild('myPalette', { static: true }) myPaletteDiv!: Palette;

  public state = {
    // Palette state props
    paletteNodeData: [
      {id:"NewClass", key:"NewClass", text:"Class: NameClass", isGroup:true, duration:9},
      {start:3, duration:1, heigth:10},
    ],
    paletteModelData: { prop: 'val' }
  };

  public paletteDivClassName = 'myPaletteDiv';

  public initPalette(): go.Palette {
    const $ = go.GraphObject.make;
    const palette = $(go.Palette);

    // define the Node template
    palette.groupTemplate =
      $(go.Group, 'Auto',      
        { name: "HEADER" },
        $(go.Shape, "Rectangle",
        {
          fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
          stroke: null
        }),
        $(go.TextBlock, { margin: 8 },
          new go.Binding('text', 'key'))
      );

    palette.nodeTemplate =
      $(go.Node, "Vertical",  
        { position: new go.Point(100, 0) },
        $(go.Shape, "Rectangle",
        {
          name: "SHAPE",
          fill: "white", stroke: "black",
          width: 10,
          height: 50,          
          // allow Activities to be resized down to 1/4 of a time unit
          minSize: new go.Size(10, 15)
        }),
        new go.Binding("duration").makeTwoWay()
      );

    palette.model = $(go.GraphLinksModel);
    return palette;
  }

}
