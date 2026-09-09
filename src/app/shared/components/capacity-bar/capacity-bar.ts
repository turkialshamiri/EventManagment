import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-capacity-bar',
  standalone: true,
  template: `
    <div class="cap" role="meter" [attr.aria-valuenow]="percent" aria-valuemin="0" aria-valuemax="100">
      @if (showLabel) {
        <div class="cap__meta">
          <span class="t-caption" style="color: var(--on-surface-variant)">{{ label }}</span>
          <span class="t-caption" style="font-weight: 600; color: var(--on-surface)">{{ percent }}%</span>
        </div>
      }
      <div class="cap__track">
        <div class="cap__fill" [style.width.%]="clamped" [attr.data-level]="level"></div>
      </div>
    </div>
  `,
  styles: `
    .cap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }
    .cap__meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cap__track {
      width: 100%;
      height: 6px;
      background: var(--surface-container);
      border-radius: 999px;
      overflow: hidden;
    }
    .cap__fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .cap__fill[data-level='ok'] {
      background: var(--status-confirmed);
    }
    .cap__fill[data-level='warn'] {
      background: var(--status-tentative);
    }
    .cap__fill[data-level='over'] {
      background: var(--status-cancelled);
    }
  `,
})
export class CapacityBarComponent {
  @Input() percent = 0;
  @Input() label = 'نسبة الاستيعاب';
  @Input() showLabel = true;

  get clamped(): number {
    return Math.max(0, Math.min(100, this.percent > 100 ? 100 : this.percent));
  }

  get level(): 'ok' | 'warn' | 'over' {
    if (this.percent > 90) return 'over';
    if (this.percent >= 70) return 'warn';
    return 'ok';
  }
}
