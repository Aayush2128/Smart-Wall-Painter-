import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({ selector: 'app-visualizer', standalone: true, imports: [FormsModule],
  template: `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="file" accept="image/jpeg,image/png" (change)="load($event)">
    <button (click)="tool='p';pend=null">Polygon</button><button (click)="tool='b';pend=null">Brush</button>
    <label>Size <input type="range" min="8" max="80" [(ngModel)]="bw"></label>
    <button (click)="undo()">Undo</button><button (click)="regs=[];pend=null;render()">Clear</button></div>
  <p style="font-size:13px">Polygon: click wall corners. Brush: drag over the wall. Then click a colour (clicking another colour recolours the last area).</p>
  <canvas #cv style="max-width:100%;border:1px solid #ccc;touch-action:none;cursor:crosshair"
    (pointerdown)="pd($event)" (pointermove)="pm($event)" (pointerup)="down=false" (pointerleave)="down=false"></canvas>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0">
    <label>Opacity <input type="range" min="20" max="100" [ngModel]="alpha*100" (ngModelChange)="setA($event)"></label>
    <label>Before ↔ After <input type="range" min="0" max="100" [(ngModel)]="cmp" (ngModelChange)="render()"></label></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    @for (c of colors; track c._id) { <button [title]="c.name" [style.background]="c.hex" (click)="paint(c.hex)" style="width:38px;height:38px;border-radius:8px;border:2px solid #ccc"></button> }
    <input type="color" (change)="paint($any($event.target).value)" title="Custom colour"></div>
  <div style="margin-top:10px"><input [(ngModel)]="name" placeholder="Design name"> <button (click)="save()">Save design</button> <button (click)="download()">Download PNG</button> <span>{{msg}}</span></div>
  <p style="font-size:12px;color:#667085">Preview only: actual colour varies with lighting, screen calibration and wall texture. Upload photos you own.</p>` })
export class VisualizerComponent implements OnInit, OnDestroy {
  @ViewChild('cv', { static: true }) cvRef!: ElementRef<HTMLCanvasElement>;
  private api = inject(ApiService);
  colors: any[] = []; img?: HTMLImageElement; W = 0; H = 0; regs: any[] = []; pend: any = null; tool = 'p'; bw = 30; alpha = 0.75; cmp = 0;
  down = false; name = ''; msg = ''; photo = ''; t0 = Date.now(); tmp = document.createElement('canvas');
  ngOnInit() { this.api.get('/colors').subscribe(c => this.colors = c); }
  ngOnDestroy() { this.api.post('/track', { type: 'session', value: Math.round((Date.now() - this.t0) / 1000) }).subscribe(); }
  get cx() { return this.cvRef.nativeElement.getContext('2d')!; }
  load(e: any) {
    const f: File = e.target.files[0]; if (!f) return;
    if (!/^image\/(jpeg|png)$/.test(f.type)) { this.msg = 'Use JPG or PNG'; return; }
    const fr = new FileReader();
    fr.onload = () => { const im = new Image(); im.onload = () => {
      this.img = im; const s = Math.min(1, 900 / im.width); this.W = Math.round(im.width * s); this.H = Math.round(im.height * s);
      const cv = this.cvRef.nativeElement; cv.width = this.tmp.width = this.W; cv.height = this.tmp.height = this.H;
      this.regs = []; this.pend = null; this.render(); this.api.post('/track', { type: 'upload' }).subscribe();
      const o = document.createElement('canvas'); o.width = this.W; o.height = this.H; o.getContext('2d')!.drawImage(im, 0, 0, this.W, this.H);
      this.photo = o.toDataURL('image/jpeg', 0.8); };
      im.src = fr.result as string; };
    fr.readAsDataURL(f);
  }
  pos(e: PointerEvent) { const r = this.cvRef.nativeElement.getBoundingClientRect(); return [(e.clientX - r.left) * this.W / r.width, (e.clientY - r.top) * this.H / r.height]; }
  pd(e: PointerEvent) { if (!this.img) return; this.down = true; const t = this.tool;
    if (!this.pend || this.pend.t !== t) this.pend = { t, pts: [], w: this.bw }; this.pend.pts.push(this.pos(e)); this.render(); }
  pm(e: PointerEvent) { if (this.down && this.tool === 'b' && this.pend) { this.pend.pts.push(this.pos(e)); this.render(); } }
  shape(c: CanvasRenderingContext2D, r: any, col: string) {
    c.fillStyle = c.strokeStyle = col; c.beginPath(); r.pts.forEach((p: number[], i: number) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    if (r.t === 'p') { c.closePath(); c.fill(); } else { c.lineWidth = r.w; c.lineCap = c.lineJoin = 'round'; if (r.pts.length === 1) c.lineTo(r.pts[0][0] + 0.1, r.pts[0][1]); c.stroke(); } }
  render(clean = false) {
    if (!this.img) return; const c = this.cx, t = this.tmp.getContext('2d')!;
    c.clearRect(0, 0, this.W, this.H); c.drawImage(this.img, 0, 0, this.W, this.H);
    for (const r of this.regs) { t.clearRect(0, 0, this.W, this.H); this.shape(t, r, r.col); c.save(); c.globalAlpha = r.a; c.globalCompositeOperation = 'multiply'; c.drawImage(this.tmp, 0, 0); c.restore(); }
    if (this.cmp > 0 && !clean) { const w = this.W * this.cmp / 100; c.save(); c.beginPath(); c.rect(0, 0, w, this.H); c.clip(); c.drawImage(this.img, 0, 0, this.W, this.H); c.restore(); c.fillStyle = '#fff'; c.fillRect(w - 1.5, 0, 3, this.H); }
    if (this.pend && !clean) { c.save(); c.globalAlpha = 0.5; if (this.pend.t === 'p') { c.strokeStyle = '#4f46e5'; c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); this.pend.pts.forEach((p: number[], i: number) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } else this.shape(c, this.pend, '#4f46e5'); c.restore(); } }
  paint(hex: string) {
    if (!this.img) { this.msg = 'Upload a room photo first'; return; }
    if (this.pend && (this.pend.t === 'b' || this.pend.pts.length >= 3)) { this.pend.col = hex; this.pend.a = this.alpha; this.regs.push(this.pend); this.pend = null; }
    else if (this.regs.length) this.regs[this.regs.length - 1].col = hex; else { this.msg = 'Select a wall area first'; return; }
    this.msg = ''; this.render(); }
  setA(v: number) { this.alpha = v / 100; if (this.regs.length && !this.pend) this.regs[this.regs.length - 1].a = this.alpha; this.render(); }
  undo() { if (this.pend?.pts.length) { this.pend.pts.pop(); if (!this.pend.pts.length) this.pend = null; } else this.regs.pop(); this.render(); }
  download() { this.render(true); const a = document.createElement('a'); a.href = this.cvRef.nativeElement.toDataURL('image/png'); a.download = 'painted-room.png'; a.click(); this.render(); }
  save() {
    if (!this.img || !this.regs.length) { this.msg = 'Paint something first'; return; }
    this.render(true); const cv = this.cvRef.nativeElement, s = Math.min(1, 320 / this.W), t = document.createElement('canvas');
    t.width = this.W * s; t.height = this.H * s; t.getContext('2d')!.drawImage(cv, 0, 0, t.width, t.height); this.render();
    this.api.post('/projects', { name: this.name || 'My design', photo: this.photo, thumb: t.toDataURL('image/jpeg', 0.6), regions: this.regs, settings: { opacity: this.alpha } })
      .subscribe({ next: () => this.msg = 'Saved!', error: e => this.msg = e.error?.error || 'Save failed' }); }
}
