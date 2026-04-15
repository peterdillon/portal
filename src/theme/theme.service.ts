import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private getColorVariable(varName: string): string {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
    return color || '#000000';
  }

  // Primary Colors
  getPrimaryColor(): string {
    return this.getColorVariable('--primary-color');
  }

  getOnPrimaryColor(): string {
    return this.getColorVariable('--on-primary-color');
  }

  getPrimaryContainer(): string {
    return this.getColorVariable('--primary-container');
  }

  getOnPrimaryContainer(): string {
    return this.getColorVariable('--on-primary-container');
  }

  // Secondary Colors
  getSecondaryColor(): string {
    return this.getColorVariable('--secondary-color');
  }

  getOnSecondaryColor(): string {
    return this.getColorVariable('--on-secondary-color');
  }

  getSecondaryContainer(): string {
    return this.getColorVariable('--secondary-container');
  }

  getOnSecondaryContainer(): string {
    return this.getColorVariable('--on-secondary-container');
  }

  // Tertiary Colors
  getTertiaryColor(): string {
    return this.getColorVariable('--tertiary-color');
  }

  getOnTertiaryColor(): string {
    return this.getColorVariable('--on-tertiary-color');
  }

  getTertiaryContainer(): string {
    return this.getColorVariable('--tertiary-container');
  }

  getOnTertiaryContainer(): string {
    return this.getColorVariable('--on-tertiary-container');
  }

  // Error Colors
  getErrorColor(): string {
    return this.getColorVariable('--error-color');
  }

  getOnErrorColor(): string {
    return this.getColorVariable('--on-error-color');
  }

  getErrorContainer(): string {
    return this.getColorVariable('--error-container');
  }

  getOnErrorContainer(): string {
    return this.getColorVariable('--on-error-container');
  }

  // Background Colors
  getBackgroundColor(): string {
    return this.getColorVariable('--background-color');
  }

  getOnBackgroundColor(): string {
    return this.getColorVariable('--on-background-color');
  }

  // Surface Colors
  getSurfaceColor(): string {
    return this.getColorVariable('--surface-color');
  }

  getOnSurfaceColor(): string {
    return this.getColorVariable('--on-surface-color');
  }

  getSurfaceVariant(): string {
    return this.getColorVariable('--surface-variant');
  }

  getOnSurfaceVariant(): string {
    return this.getColorVariable('--on-surface-variant');
  }

  // Outline Colors
  getOutlineColor(): string {
    return this.getColorVariable('--outline-color');
  }

  getOutlineVariant(): string {
    return this.getColorVariable('--outline-variant');
  }
}