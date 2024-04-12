import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import * as go from 'gojs';
import { DataSyncService, PaletteComponent, DiagramComponent as Diagram } from 'gojs-angular';
import produce from "immer";

interface data{
  id: string;
  key: string;
  text: string;
  isGroup: boolean;
  loc: string;
  duration: number;
}

@Component({
  selector: 'diagram-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class DiagramComponent {

  @ViewChild('myDiagram', { static: true }) public myDiagramComponent!: Diagram;

  constructor(private cdr: ChangeDetectorRef) { }

  state = {
    // Diagram state props
    diagramNodeData: [
      {id:"Fred", key:"Fred", text:"Fred: Patron", isGroup:true, loc:"0 0", duration:9},
    ],
    diagramLinkData: [],
    diagramModelData: { prop: 'value' },
    skipsDiagramUpdate: false,
    selectedNodeData: null, // used by InspectorComponent
  }

  public diagramDivClassName: string = 'myDiagramDiv';

  public selectedNodeData: go.ObjectData | any = null;
  public observedDiagram:any = null;

  public initDiagram(): go.Diagram {

    const $ = go.GraphObject.make;
    const dia = $(go.Diagram, {
      'undoManager.isEnabled': true,
      'clickCreatingTool.archetypeNodeData': { text: 'new node', color: 'lightblue' },
      model: $(go.GraphLinksModel,
        {
          nodeKeyProperty: 'id',
          linkToPortIdProperty: 'toPort',
          linkFromPortIdProperty: 'fromPort',
          linkKeyProperty: 'key' // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
        }
      )
    });

    dia.commandHandler.archetypeGroupData = { key: 'Group', isGroup: true };


    // define the Lifeline Node template.
    dia.groupTemplate =
    $(go.Group, "Vertical",
      {
        locationSpot: go.Spot.Bottom,
        locationObjectName: "HEADER",
        minLocation: new go.Point(0, 0),
        maxLocation: new go.Point(9999, 0),
        selectionObjectName: "HEADER"
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(go.Panel, "Auto",
        { name: "HEADER" },
        $(go.Shape, "Rectangle",
          {
            fill: $(go.Brush, "Linear", { 0: "#bbdefb", 1: go.Brush.darkenBy("#bbdefb", 0.1) }),
            stroke: null
          }),
        $(go.TextBlock,
          {
            margin: 5,
            font: "400 10pt Source Sans Pro, sans-serif"
          },
          new go.Binding("text", "text"))
      ),
      $(go.Shape,
        {
          figure: "LineV",
          fill: null,
          stroke: "gray",
          strokeDashArray: [3, 3],
          width: 1,
          alignment: go.Spot.Center,
          portId: "",
          fromLinkable: true,
          fromLinkableDuplicates: true,
          toLinkable: true,
          toLinkableDuplicates: true,
          cursor: "pointer"
        },
        new go.Binding("height", "duration", go.Point.parse))
    );

    // define the Node template
    dia.nodeTemplate =
      $(go.Node, 'Spot',
        {
          contextMenu:
            $('ContextMenu',
              $('ContextMenuButton',
                $(go.TextBlock, 'Group'),
                { click: function(e, obj) { e.diagram.commandHandler.groupSelection(); } },
                new go.Binding('visible', '', function(o) {
                  return o.diagram.selection.count > 1;
                }).ofObject())
            )
        },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Panel, 'Auto',
          $(go.Shape, 'RoundedRectangle', { stroke: null },
            new go.Binding('fill', 'color', (c, panel) => {

              return c;
            })
          ),
          $(go.TextBlock, { margin: 8, editable: true },
            new go.Binding('text').makeTwoWay())
        ),
        
      );
    return dia;
  }

  public diagramModelChange(changes: go.IncrementalData) {
    if (!changes) return;
    const appComp = this;
    this.state = produce(this.state, draft => {
      // set skipsDiagramUpdate: true since GoJS already has this update
      // this way, we don't log an unneeded transaction in the Diagram's undoManager history
      draft.skipsDiagramUpdate = true;
      const nodeData: any = DataSyncService.syncNodeData(changes, draft.diagramNodeData, appComp.observedDiagram.model);
      const linkData: any = DataSyncService.syncLinkData(changes, draft.diagramLinkData, appComp.observedDiagram.model);
      const modelData: any = DataSyncService.syncModelData(changes, draft.diagramModelData);
      draft.diagramNodeData = nodeData;
      draft.diagramLinkData = linkData;
      draft.diagramModelData = modelData;
      // If one of the modified nodes was the selected node used by the inspector, update the inspector selectedNodeData object
      const modifiedNodeDatas = changes.modifiedNodeData;
      if (modifiedNodeDatas && draft.selectedNodeData) {
        for (let i = 0; i < modifiedNodeDatas.length; i++) {
          const mn:any = modifiedNodeDatas[i];
          const nodeKeyProperty:any = appComp.myDiagramComponent.diagram.model.nodeKeyProperty as string;
          if (mn[nodeKeyProperty] === draft.selectedNodeData![nodeKeyProperty]) {
            draft.selectedNodeData = mn;
          }
        }
      }
    });
  };

  public ngAfterViewInit() {
    if (this.observedDiagram) return;
    this.observedDiagram = this.myDiagramComponent.diagram;
    this.cdr.detectChanges(); // IMPORTANT: without this, Angular will throw ExpressionChangedAfterItHasBeenCheckedError (dev mode only)

    const appComp: DiagramComponent = this;
    // listener for inspector
    this.myDiagramComponent.diagram.addDiagramListener('ChangedSelection', function(e) {
      if (e.diagram.selection.count === 0) {
        appComp.selectedNodeData = null;
      }
      const node = e.diagram.selection.first();
      appComp.state = produce(appComp.state, draft => {
        if (node instanceof go.Node) {
          var idx = draft.diagramNodeData.findIndex(nd => nd.id == node.data.id);
          var nd:any = draft.diagramNodeData[idx];
          draft.selectedNodeData = nd;
        } else {
          draft.selectedNodeData = null;
        }
      });
    });
  } // end ngAfterViewInit

  /**
   * Update a node's data based on some change to an inspector row's input
   * @param changedPropAndVal An object with 2 entries: "prop" (the node data prop changed), and "newVal" (the value the user entered in the inspector <input>)
   */
  public handleInspectorChange(changedPropAndVal:any) {

    const path = changedPropAndVal.prop;
    const value = changedPropAndVal.newVal;

    this.state = produce(this.state, draft => {
      var data: any = draft.selectedNodeData;
      data[path] = value;
      const key = data.id;
      const idx = draft.diagramNodeData.findIndex(nd => nd.id == key);
      if (idx >= 0) {
        draft.diagramNodeData[idx] = data;
        draft.skipsDiagramUpdate = false; // we need to sync GoJS data with this new app state, so do not skips Diagram update
      }
    });
  }

}
