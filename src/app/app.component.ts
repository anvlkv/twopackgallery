import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserStorageService } from './browser-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'twopack.gallery';

  constructor(private storage: BrowserStorageService, private router: Router) {}
}
