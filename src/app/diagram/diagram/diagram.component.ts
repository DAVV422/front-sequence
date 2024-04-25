import { ChangeDetectorRef, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import * as go from 'gojs';
import { DataSyncService, DiagramComponent as Diagram } from 'gojs-angular';
import produce from "immer";

interface data{
  id: string;
  key: string;
  text: string;
  isGroup: boolean;
  loc: string;
  duration: number;
}

// some parameters
const LinePrefix = 20;  // vertical starting point in document for all Messages and Activations
const LineSuffix = 30;  // vertical length beyond the last message time
const MessageSpacing = 20;  // vertical distance between Messages at different steps
const ActivityWidth = 10;  // width of each vertical activity bar
const ActivityStart = 5;  // height before start message time
const ActivityEnd = 5;  // height beyond end message time

@Component({
  selector: 'diagram-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class DiagramComponent {

  @ViewChild('myDiagram', { static: true }) public myDiagramComponent!: Diagram;

  constructor(private cdr: ChangeDetectorRef) { }

  public state = {
    // Diagram state props
    diagramNodeData: [
      {id:"Fred", key:"Fred", text:"Fred: Patron", isGroup:true, loc:"0 0", duration:9},
      {group:"Fred", start:2, duration:2, key:'grupo1'},
    ],
    diagramLinkData: [],
    diagramModelData: { prop: 'value' },
    skipsDiagramUpdate: false,
    selectedNodeData: null, // used by InspectorComponent
  }

  public diagramDivClassName: string = 'myDiagramDiv';

  public selectedNodeData: go.ObjectData | any = null;
  public observedDiagram:any = null;

  public diagrama!: go.Diagram;

// initialize diagram / templates
public initDiagram(): go.Diagram {

  const $ = go.GraphObject.make;
  this.diagrama = $(go.Diagram, {
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

  this.diagrama.commandHandler.archetypeGroupData = { key: 'Group', isGroup: true };

  const makePort = function(id: string, spot: go.Spot) {
    return $(go.Shape, 'Circle',
      {
        opacity: .5,
        fill: 'gray', strokeWidth: 0, desiredSize: new go.Size(8, 8),
        portId: id, alignment: spot,
        fromLinkable: true, toLinkable: true
      }
    );
  }

  const computeActivityLocation = (act: any) => {
    const groupdata: go.ObjectData | null = this.diagrama.model.findNodeDataForKey(act.group);
    if (groupdata === null) return new go.Point();
    // get location of Lifeline's starting point
    const grouploc = go.Point.parse(groupdata['loc']);
    return new go.Point(grouploc.x, convertTimeToY(act.start) - ActivityStart);
  }

  const backComputeActivityLocation = (loc: any, act: any) => {
    this.diagrama.model.setDataProperty(act, "start", convertYToTime(loc.y + ActivityStart));
  }

  const computeLifelineHeight = (duration: number) => {
    return LinePrefix + duration * MessageSpacing + LineSuffix;
  }

  const computeActivityHeight = (duration: number) => {
    return ActivityStart + duration * MessageSpacing + ActivityEnd;
  };

  const backComputeActivityHeight = (height: number) => {
    return (height - ActivityStart - ActivityEnd) / MessageSpacing;
  }

  const convertTimeToY = (t: number) => {
    return t * MessageSpacing + LinePrefix;
  }

  const convertYToTime = (y: number) => {
    return (y - LinePrefix) / MessageSpacing;
  }

  // define the Lifeline Node template.
  this.diagrama.groupTemplate =
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
        cursor: "pointer"
      },
      new go.Binding("height", "duration", computeLifelineHeight))
  );


  // define the Activity Node template
  this.diagrama.nodeTemplate =
  $(go.Node,
    {
      locationSpot: go.Spot.Top,
      locationObjectName: "SHAPE",
      minLocation: new go.Point(NaN, LinePrefix - ActivityStart),
      maxLocation: new go.Point(NaN, 19999),
      selectionObjectName: "SHAPE",
      resizable: true,
      resizeObjectName: "SHAPE",
      movable: true,
      resizeAdornmentTemplate:
        $(go.Adornment, "Spot",
          $(go.Placeholder),
          $(go.Shape,  // only a bottom resize handle
            {
              alignment: go.Spot.Bottom, cursor: "col-resize",
              desiredSize: new go.Size(6, 6), fill: "yellow"
            })
        ),
      fromSpot: go.Spot.TopSide,
      toSpot: go.Spot.BottomSide
    },
    new go.Binding("location", "", computeActivityLocation).makeTwoWay(backComputeActivityLocation),
    $(go.Shape, "Rectangle",
      {
        name: "SHAPEBOX",
        fill: "white", stroke: "black",
        width: ActivityWidth,
        // allow Activities to be resized down to 1/4 of a time unit
        minSize: new go.Size(ActivityWidth, computeActivityHeight(0.25)),
        // Permite que el nodo actúe como un punto de conexión de salida y entrada para enlaces
        fromLinkable: true,
        toLinkable: true,
        portId: "SHAPEBOX", // Asigna un portId único
        fromSpot: go.Spot.AllSides, // Permitir conexiones desde todos los lados
        toSpot: go.Spot.AllSides // Permitir conexiones desde todos los lados
      },
      new go.Binding("height", "duration", computeActivityHeight).makeTwoWay(backComputeActivityHeight)
    ),
  );

  this.diagrama.linkTemplate =
  $(go.Link,
    { selectionAdorned: true, curviness: 0 },
    $(go.Shape, "Rectangle",
      { stroke: "black" }),
    $(go.Shape,
      { toArrow: "OpenTriangle", stroke: "black" }), // Flecha en el extremo "to"
    $(go.TextBlock,
      {
        font: "400 9pt Source Sans Pro, sans-serif",
        segmentIndex: 0,
        segmentOffset: new go.Point(NaN, NaN),
        isMultiline: false,
        editable: true
      },
    new go.Binding("text", "text").makeTwoWay())
  );

  return this.diagrama;
}


  // When the diagram model changes, update app data to reflect those changes. Be sure to use immer's "produce" function to preserve immutability
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
      console.log(nodeData);
      draft.diagramNodeData = nodeData;
      draft.diagramLinkData = linkData;
      draft.diagramModelData = modelData;
      // If one of the modified nodes was the selected node used by the inspector, update the inspector selectedNodeData object
      const modifiedNodeDatas = changes.modifiedNodeData;
      console.log(draft.selectedNodeData);
      if (modifiedNodeDatas && draft.selectedNodeData) {
        for (let i = 0; i < modifiedNodeDatas.length; i++) {
          const mn: any = modifiedNodeDatas[i];
          const nodeKeyProperty: any = appComp.myDiagramComponent.diagram.model.nodeKeyProperty as string;
          if (mn[nodeKeyProperty] === draft.selectedNodeData![nodeKeyProperty]) {
            draft.selectedNodeData = mn;
            console.log(draft.selectedNodeData);
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
      console.log("selecciona");
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
    console.log('inspecciona')
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
