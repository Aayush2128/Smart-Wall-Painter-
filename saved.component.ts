import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './api.service';

@Component({ selector: 'app-saved', standalone: true,
  template: `<h2>Saved designs</h2>
  @if (!list.length) { <p>No saved designs yet.</p> }
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px">
  @for (p of list; track p._id) {
    <div style="border:1px solid #ccc;border-radius:10px;padding:8px"><img [src]="p.thumb" style="width:100%;border-radius:6px">
      <b>{{p.name}}</b><div style="font-size:12px">{{p.user?.name}} · {{p.createdAt.slice(0,10)}}</div>
      <button (click)="del(p._id)">Delete</button></div> }</div>` })
export class SavedComponent implements OnInit {
  private api = inject(ApiService); list: any[] = [];
  ngOnInit() { this.load(); }
  load() { this.api.get('/projects').subscribe(x => this.list = x); }
  del(id: string) { this.api.del('/projects/' + id).subscribe(() => this.load()); }
}
