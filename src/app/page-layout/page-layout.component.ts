import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { ActivityService } from '../activity.service';
import { ArtFormsService } from '../art-forms.service';
import { HeaderComponent } from '../header/header.component';
import { LocationService } from '../location.service';
import { PointsService } from '../points.service';
import { UserService } from '../user.service';
import { ZoomSyncService } from '../zoom-sync.service';

@Component({
  standalone: true,
  imports: [RouterModule, NzLayoutModule, HeaderComponent],
  selector: 'app-page-layout',
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.scss'],
  providers: [
    PointsService,
    ArtFormsService,
    LocationService,
    ZoomSyncService,
    ActivityService,
    UserService,
  ],
})
export class PageLayoutComponent {}
