import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <article class="kpi em-card">
      <div class="kpi__top">
        <span class="t-label-sm" style="color: var(--on-surface-variant); font-weight: 500">{{ title }}</span>
        <div class="kpi__icon" [class.gold]="iconTone === 'gold'">
          <span class="material-symbols-outlined">{{ icon }}</span>
        </div>
      </div>
      <div class="kpi__metric">
        <span class="t-metric">{{ value }}</span>
        @if (unit) {
          <span class="t-caption unit">{{ unit }}</span>
        }
        <ng-content select="[kpiTrailing]" />
      </div>
      <div class="kpi__footer t-caption" style="color: var(--on-surface-variant)">
        <ng-content />
      </div>
    </article>
  `,
  styles: `
    .kpi {
      padding: var(--gutter-md);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 118px;
    }
    .kpi__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--gutter-sm);
    }
    .kpi__icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-lg);
      background: var(--surface-container);
      display: grid;
      place-items: center;
      color: var(--on-surface);
      flex-shrink: 0;
    }
    .kpi__icon.gold {
      background: color-mix(in srgb, var(--secondary-container) 40%, transparent);
      color: var(--secondary);
    }
    .kpi__icon .material-symbols-outlined {
      font-size: 18px;
    }
    .kpi__metric {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-block: var(--gutter-xs);
      flex-wrap: wrap;
    }
    .unit {
      color: var(--on-surface-variant);
      margin-inline-start: 2px;
    }
    .kpi__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--gutter-xs);
      flex-wrap: wrap;
    }
  `,
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input() unit = '';
  @Input() icon = 'analytics';
  @Input() iconTone: 'default' | 'gold' = 'default';
}
