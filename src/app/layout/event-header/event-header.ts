import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-event-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './event-header.html',
  styleUrl: './event-header.scss',
})
export class EventHeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();

  readonly todayLabel = 'الخميس، 24 أكتوبر 2024';
  readonly occupancy = 85;
}
