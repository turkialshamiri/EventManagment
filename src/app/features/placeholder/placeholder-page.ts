import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  template: `
    <div class="em-page">
      <div class="em-card panel">
        <span class="material-symbols-outlined ico">{{ icon() }}</span>
        <h1 class="t-headline-xl">{{ title() }}</h1>
        <p class="t-body-md muted">
          هذه الشاشة جزء من الخدمات المشتركة للفندق وستُربط لاحقاً بالأنظمة التشغيلية.
        </p>
      </div>
    </div>
  `,
  styles: `
    .panel {
      padding: 3rem var(--gutter-xl);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--gutter-sm);
      max-width: 640px;
    }
    .ico {
      font-size: 40px;
      color: var(--secondary);
    }
    .muted {
      color: var(--on-surface-variant);
    }
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = toSignal(this.route.data.pipe(map((d) => (d['title'] as string) || 'قريباً')), {
    initialValue: 'قريباً',
  });
  readonly icon = toSignal(
    this.route.data.pipe(map((d) => (d['icon'] as string) || 'construction')),
    { initialValue: 'construction' }
  );
}
