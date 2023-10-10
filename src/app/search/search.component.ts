import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  BehaviorSubject,
  Subscription,
  combineLatest,
  debounceTime,
  filter,
  map,
  skipWhile,
  switchMap,
  take,
} from 'rxjs';
import { SearchService } from '../search.service';
import { ESearchType } from '../search.types';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';

export type Term = {
  type: ESearchType;
  query: string;
  constrain?: {
    label: string;
    value: string;
  };
};

export type Option = {
  groupTitle: string;
  type: ESearchType;
  terms: {
    label: string;
    value: Term;
  }[];
};
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzAutocompleteModule,
    NzIconModule,
    NzSpinModule,
    NzTagModule,
    NzButtonModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  providers: [SearchService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  isActivated$ = new BehaviorSubject(false);
  autoCompleteFilter$ = new BehaviorSubject<Term | undefined>(undefined);
  searchOptions?: Option[];

  // filteredOptions = combineLatest({
  //   filter:
  //   options: this.searchOptions$,
  // }).pipe(

  // );

  search: Term = { type: ESearchType.FreeForm, query: '' };

  subs: Subscription[] = [];

  @Input('wideActivated')
  wideActivated = false;

  @ViewChild('inputRef')
  inputRef!: ElementRef<HTMLInputElement>;

  searchTypes = ESearchType;
  disabledSubmit = false;

  constructor(
    private service: SearchService,
    private ch: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const options$ = this.isActivated$.pipe(
      skipWhile((a) => !a),
      take(1),
      switchMap(() =>
        this.service.initSearchData().pipe(
          map((data) => {
            return [
              {
                groupTitle: 'Art forms',
                type: ESearchType.ByArtForm,
                terms: data.tops.art_forms.map((af) => ({
                  label: af.name as string,
                  value: {
                    type: ESearchType.ByArtForm,
                    constrain: { value: af.id, label: af.name as string },
                    query: '',
                  },
                })),
              },
              {
                groupTitle: 'Artists',
                type: ESearchType.ByPublisher,
                terms: data.tops.tags.map((tag) => ({
                  label: `@${tag}`,
                  value: {
                    type: ESearchType.ByPublisher,
                    constrain: { value: tag, label: `@${tag}` },
                    query: '',
                  },
                })),
              },
            ] as Option[];
          })
        )
      )
    );

    this.subs.push(
      combineLatest({
        options: options$,
        filter: this.autoCompleteFilter$.pipe(debounceTime(300)),
      })
        .pipe(
          map(({ filter, options }) => {
            if (!filter) {
              return options;
            }

            let filterOpts = options;

            if (filter.type !== ESearchType.FreeForm) {
              filterOpts = filterOpts.filter(
                ({ type }) => type !== filter.type
              );
            }

            if (!filter?.query) {
              return filterOpts;
            }

            return filterOpts.reduce((acc, opt, at, all) => {
              const terms = opt.terms.filter((o) =>
                o.label.toLowerCase().includes(filter.query.toLowerCase())
              );
              if (terms.length) {
                acc.push({
                  ...opt,
                  terms,
                });
              }
              return acc;
            }, [] as Option[]);
          })
        )
        .subscribe((options) => {
          this.searchOptions = options;
          this.ch.detectChanges();
        })
    );

    this.subs.push(
      this.service.loadingQuery.subscribe((q) => {
        this.disabledSubmit = q?.query === this.search.query;
      })
    );

    this.subs.push(
      this.activatedRoute.queryParams
        .pipe(take(1))
        .subscribe(({ type, query }) => {
          if (
            query &&
            [
              ESearchType.ByArtForm,
              ESearchType.ByPublisher,
              ESearchType.FreeForm,
            ].includes(type)
            || [
              ESearchType.ByArtForm,
              ESearchType.ByPublisher,
            ].includes(type)
          ) {
            this.isActivated$.next(true);
          }
        })
    );

    this.subs.push(
      combineLatest({
        options: options$,
        qParams: this.activatedRoute.queryParams,
      })
        .pipe(filter(({ qParams }) => qParams['type']))
        .subscribe(({ qParams, options }) => {
          switch (qParams['type']) {
            case ESearchType.FreeForm: {
              this.search = {
                type: ESearchType.FreeForm,
                query: qParams['query'],
              };
              break;
            }
            default: {
              const selected = options
                .find(({ type }) => type === qParams['type'])
                ?.terms.find(
                  ({ value }) => value.constrain?.value === qParams['constrain']
                );

              this.search = {
                type: qParams['type'],
                query: qParams['query'],
                constrain: {
                  value: qParams['constrain'],
                  label: selected?.label || '...',
                },
              };

              break;
            }
          }

          this.autoCompleteFilter$.next(this.search);
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  onFocus(ev: FocusEvent) {
    this.isActivated$.next(true);
    this.ch.detectChanges();
    return ev;
  }

  onBlur(ev: FocusEvent) {
    this.isActivated$.next(false);
    this.ch.detectChanges();
    return ev;
  }

  onInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.search.query = input.value;

    this.autoCompleteFilter$.next(this.search);

    this.ch.detectChanges();
    return false;
  }

  onKeyDown(ev: KeyboardEvent) {
    switch (ev.key.toLowerCase()) {
      case 'enter': {
        this.onSearch();
        return false;
      }
      case 'backspace': {
        if (
          !this.search.query.length &&
          this.search.type !== ESearchType.FreeForm
        ) {
          this.search = {
            type: ESearchType.FreeForm,
            query: '',
          };
          this.autoCompleteFilter$.next(this.search);
          return false;
        }
        break;
      }
      default: {
        break;
      }
    }

    return ev;
  }

  onSearch(ev?: MouseEvent) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    if (this.search.query.length || this.search.constrain) {
      if (
        this.activatedRoute.snapshot.url.find(({ path }) => path === 'search')
      ) {
        this.router.navigate(['.'], {
          queryParams: {
            ...this.search,
            constrain: this.search.constrain?.value,
          },
          relativeTo: this.activatedRoute,
        });
      } else {
        this.router.navigate(['./', 'search'], {
          queryParams: {
            ...this.search,
            constrain: this.search.constrain?.value,
          },
          relativeTo: this.activatedRoute,
        });
      }
    }

    return false;
  }

  clearFilter() {
    this.search = {
      type: ESearchType.FreeForm,
      query: this.search.query,
    };
  }

  onSearchChange(value: string | Term) {
    if (typeof value === 'string') {
      return false;
    }

    this.search = value;
    this.inputRef.nativeElement.value = value.query;
    this.autoCompleteFilter$.next(this.search);

    return false;
  }

  searchCompareFn = (a: Term, b: Term) =>
    a.type === b.type && a.constrain?.value === b.constrain?.value;
}
