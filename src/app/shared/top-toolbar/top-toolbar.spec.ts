import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopToolbar } from './top-toolbar';

describe('TopToolbar', () => {
  let component: TopToolbar;
  let fixture: ComponentFixture<TopToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopToolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(TopToolbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
