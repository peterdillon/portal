import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteManager } from './site-manager';

describe('SiteManager', () => {
  let component: SiteManager;
  let fixture: ComponentFixture<SiteManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});