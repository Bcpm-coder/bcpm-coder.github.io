import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PORTFOLIO_PROFILE } from '../../../services/app-config';

@Component({
  selector: 'app-contact',
  imports: [CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactComponent {
  readonly contact = PORTFOLIO_PROFILE;
}
