import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PointsService } from './points.service';
import { LocationService } from './location.service';
import { Subscription } from 'rxjs';
import {
  ActivatedRoute,
  EventType,
  Router,
  RouterOutlet,
} from '@angular/router';
import { BrowserStorageService } from './browser-storage.service';
import { AUTH_REDIRECTS_KEY, IRedirects } from './isAuthenticated.guard';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'twopack.gallery';

  constructor(private storage: BrowserStorageService, private router: Router) {
  }

  ngOnInit(): void {
    this.handleRedirects(this.storage.take<IRedirects>(AUTH_REDIRECTS_KEY));
    this.router.initialNavigation();
  }

  private handleRedirects(redirects?: IRedirects) {
    if (!redirects) {
      return;
    }
    this.router.navigate(redirects.urlPaths, {
      queryParams: redirects.query,
      replaceUrl: true,
    });
  }
}
