import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { ActivityService } from '../activity.service';
import { ArtFormsService } from '../art-forms.service';
import { HeaderComponent } from '../header/header.component';
import { LocationService } from '../location.service';
import { PaddedPageContentComponent } from '../padded-page-content/padded-page-content.component';
import { PointsService } from '../points.service';
import { ZoomSyncService } from '../zoom-sync.service';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    NzLayoutModule,
    NzButtonModule,
    NzIconModule,
    HeaderComponent,
    PaddedPageContentComponent,
  ],
  selector: 'app-page-layout',
  templateUrl: './page-layout.component.html',
  styleUrls: ['./page-layout.component.scss'],
  providers: [
    PointsService,
    ArtFormsService,
    LocationService,
    ZoomSyncService,
    ActivityService,
  ],
})
export class PageLayoutComponent {}
