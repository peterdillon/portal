import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteUserManager } from './site-user-manager';

describe('SiteUserManager', () => {
  let component: SiteUserManager;
  let fixture: ComponentFixture<SiteUserManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteUserManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteUserManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});