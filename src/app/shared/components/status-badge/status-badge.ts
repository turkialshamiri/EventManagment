import { Component, Input } from '@angular/core';
import { EventStatus, EVENT_STATUS_LABELS } from '../../../core/models/event.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="badge" [attr.data-status]="status" [class.pulse]="status === 'in_progress'">
      @if (showDot) {
        <span class="dot" aria-hidden="true"></span>
      }
      <span class="label">{{ customLabel || EVENT_STATUS_LABELS[status] }}</span>
    </span>
  `,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      line-height: 14px;
      font-weight: 600;
      border: 1px solid transparent;
      white-space: nowrap;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: currentColor;
    }
    .badge.pulse .dot {
      animation: pulse-dot 1.5s ease-in-out infinite;
    }
    .badge[data-status='confirmed'] {
      background: var(--status-confirmed-bg);
      color: #065f46;
      border-color: var(--status-confirmed-border);
    }
    .badge[data-status='tentative'] {
      background: var(--status-tentative-bg);
      color: #92400e;
      border-color: var(--status-tentative-border);
    }
    .badge[data-status='in_progress'] {
      background: var(--status-active-bg);
      color: #1e40af;
      border-color: var(--status-active-border);
    }
    .badge[data-status='draft'] {
      background: var(--status-draft-bg);
      color: var(--status-draft);
      border-color: var(--status-draft-border);
    }
    .badge[data-status='completed'] {
      background: var(--status-completed-bg);
      color: var(--status-completed);
      border-color: var(--status-active-border);
    }
    .badge[data-status='cancelled'] {
      background: var(--status-cancelled-bg);
      color: var(--status-cancelled);
      border-color: var(--status-cancelled-border);
    }
  `,
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: EventStatus;
  @Input() customLabel = '';
  @Input() showDot = false;
  readonly EVENT_STATUS_LABELS = EVENT_STATUS_LABELS;
}
