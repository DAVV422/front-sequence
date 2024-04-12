import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectorRowComponent } from './inspector-row.component';

describe('InspectorRowComponent', () => {
  let component: InspectorRowComponent;
  let fixture: ComponentFixture<InspectorRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InspectorRowComponent]
    });
    fixture = TestBed.createComponent(InspectorRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
