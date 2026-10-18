import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ShareModalComponent } from '../../components/share-modal/share-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ShareModalComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  animations: [
    trigger('arrive', [
      transition(':enter', [
        query('.reveal', [
          style({ opacity: 0, transform: 'translateY(18px)' }),
          stagger(80, [
            animate('700ms cubic-bezier(.22, .7, .25, 1)', style({ opacity: 1, transform: 'none' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('sceneIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(28px)' }),
        animate('900ms 120ms cubic-bezier(.22, .7, .25, 1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class HomeComponent {
  shareOpen = false;

  openShareModal(): void {
    this.shareOpen = true;
  }

  closeShareModal(): void {
    this.shareOpen = false;
  }
}
