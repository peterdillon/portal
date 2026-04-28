import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EgmDetailComponent } from './egm-detail';

describe('EgmDetailComponent', () => {
  let component: EgmDetailComponent;
  let fixture: ComponentFixture<EgmDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EgmDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EgmDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
