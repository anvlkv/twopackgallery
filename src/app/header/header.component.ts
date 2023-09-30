import { Component, Input } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input('card')
  isCard?: boolean


  returnTo: string;

  constructor(
    public auth: AuthService
  ){
    this.returnTo = document.location.origin
  }
}
