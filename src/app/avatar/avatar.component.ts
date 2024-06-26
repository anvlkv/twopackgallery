import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AuthService, User } from '@auth0/auth0-angular';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzAvatarModule
  ],
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent implements OnInit, OnDestroy {
  @Input('size')
  size!: 'small' | 'large' | 'default';

  authUserSubscription?: Subscription;

  user?: User | null;

  @Input('icon')
  icon: string = 'user'

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.authUserSubscription = this.auth.user$.subscribe((user) => (this.user = user));
  }

  ngOnDestroy(): void {
    this.authUserSubscription?.unsubscribe();
  }
}
