import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EventSidebarComponent } from '../event-sidebar/event-sidebar';
import { EventHeaderComponent } from '../event-header/event-header';

@Component({
  selector: 'app-event-shell',
  standalone: true,
  imports: [RouterOutlet, EventSidebarComponent, EventHeaderComponent],
  templateUrl: './event-shell.html',
  styleUrl: './event-shell.scss',
})
export class EventShellComponent {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
