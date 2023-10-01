import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-authorize',
  templateUrl: './authorize.component.html',
  styleUrls: ['./authorize.component.scss']
})
export class AuthorizeComponent implements OnInit {
  constructor(
    private auth: AuthService
  ){}

  ngOnInit(): void {
    this.auth.loginWithRedirect()
  }
}
