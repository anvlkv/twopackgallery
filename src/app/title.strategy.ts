import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";

@Injectable({providedIn: 'root'})
export class TemplatePageTitleStrategy extends TitleStrategy {


  constructor(private readonly title: Title) {
    super();
  }

  private _entityTitle?: string;
  entityTitle(title: string) {
    this._entityTitle = title;
    this.updateViewTitle();
  }
  clearEntityTitle() {
    this._entityTitle = undefined;
    this.updateViewTitle();
  }

  updateViewTitle() {
    const pageTitle = [
      this._entityTitle,
      this._title,
      'twopack.gallery'
    ].filter(Boolean)
    .join(' | ')
    
    this.title.setTitle(pageTitle);
  }

  private _title?: string;
  override updateTitle(routerState: RouterStateSnapshot) {
    this._title = this.buildTitle(routerState);
    this.updateViewTitle()
  }
}