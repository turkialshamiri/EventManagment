import { Component, Input, Output, EventEmitter } from '@angular/core';

export type PageStateKind = 'loading' | 'empty' | 'no-results' | 'error';

@Component({
  selector: 'app-page-state',
  standalone: true,
  template: `
    <div class="state em-card" [attr.data-kind]="kind" role="status">
      @if (kind === 'loading') {
        <div class="skeletons">
          @for (i of [1, 2, 3]; track i) {
            <div class="em-skeleton row"></div>
          }
        </div>
        <p class="t-body-sm" style="color: var(--on-surface-variant)">جاري التحميل...</p>
      } @else {
        <div class="icon-wrap">
          <span class="material-symbols-outlined">{{ icon }}</span>
        </div>
        <h3 class="t-headline-sm">{{ title }}</h3>
        <p class="t-body-sm" style="color: var(--on-surface-variant)">{{ description }}</p>
        @if (actionLabel) {
          <button type="button" class="em-btn em-btn--primary" (click)="action.emit()">
            {{ actionLabel }}
          </button>
        }
      }
    </div>
  `,
  styles: `
    .state {
      padding: 2.5rem var(--gutter-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--gutter-sm);
      min-height: 200px;
      justify-content: center;
    }
    .icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-xl);
      background: var(--surface-container);
      display: grid;
      place-items: center;
      color: var(--secondary);
      margin-bottom: var(--gutter-xs);
    }
    .icon-wrap .material-symbols-outlined {
      font-size: 28px;
    }
    .state[data-kind='error'] .icon-wrap {
      background: var(--error-container);
      color: var(--error);
    }
    .skeletons {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: var(--gutter-sm);
    }
    .row {
      height: 40px;
      width: 100%;
    }
  `,
})
export class PageStateComponent {
  @Input({ required: true }) kind!: PageStateKind;
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() icon = 'inbox';
  @Output() action = new EventEmitter<void>();
}
