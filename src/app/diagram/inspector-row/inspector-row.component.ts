import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'diagram-inspector-row',
  templateUrl: './inspector-row.component.html',
  styleUrls: ['./inspector-row.component.css']
})
export class InspectorRowComponent {
  @Input()
  public id!: string

  @Input()
  public value!: string

  @Output()
  public onInputChangeEmitter: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  public onInputChange(e: any) {
    // when <input> is changed, emit an Object up, with what property changed, and to what new value
    this.onInputChangeEmitter.emit({prop: this.id, newVal: e.target.value});
  }
}
