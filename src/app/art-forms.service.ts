import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { JSONData } from '@xata.io/client';
import { BehaviorSubject } from 'rxjs';
import type { ArtFormsRecord } from 'xata';


@Injectable({
  providedIn: 'root',
})
export class ArtFormsService {
  public fetchedArtForms = new BehaviorSubject<JSONData<ArtFormsRecord>[]>([]);

  constructor(private http: HttpClient) {}

  public queryArtForms() {
    this.http
      .get<JSONData<ArtFormsRecord>[]>('/.netlify/functions/art_forms_list')
      .subscribe((data) => this.fetchedArtForms.next(data));
  }
}
