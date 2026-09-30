import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({ selector: 'app-admin', standalone: true, imports: [FormsModule],
  template: `<h2>Admin panel</h2>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    @for (k of kpis(); track k[0]) { <div style="border:1px solid #ccc;border-radius:10px;padding:8px 14px"><small>{{k[0]}}</small><br><b style="font-size:22px">{{k[1]}}</b></div> }</div>
  <h3>Manage colours</h3>
  @for (c of colors; track c._id) { <div><span [style.background]="c.hex" style="display:inline-block;width:20px;height:20px;vertical-align:middle;border-radius:4px"></span>
    {{c.name}} {{c.hex}} <button (click)="del(c._id)">Remove</button></div> }
  <div style="margin-top:8px"><input [(ngModel)]="n" placeholder="Name"> <input type="color" [(ngModel)]="hex"> <button (click)="add()">Add colour</button></div>` })
export class AdminComponent implements OnInit {
  private api = inject(ApiService); colors: any[] = []; stats: any = {}; n = ''; hex = '#88aa99';
  ngOnInit() { this.load(); }
  kpis() { const s = this.stats; return [['Users', s.users], ['Photos uploaded', s.uploads], ['Designs saved', s.designsSaved], ['Avg session (s)', s.avgSessionSeconds], ['Colours', s.colours]]; }
  load() { this.api.get('/colors').subscribe(x => this.colors = x); this.api.get('/admin/stats').subscribe(x => this.stats = x); }
  add() { if (this.n) this.api.post('/colors', { name: this.n, hex: this.hex, brand: 'Custom', finishes: ['Matte'] }).subscribe(() => { this.n = ''; this.load(); }); }
  del(id: string) { this.api.del('/colors/' + id).subscribe(() => this.load()); }
}
