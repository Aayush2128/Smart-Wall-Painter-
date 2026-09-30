require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const { Schema } = mongoose;

const User = mongoose.model('User', new Schema({ name: String, email: { type: String, unique: true }, passwordHash: String,
  role: { type: String, default: 'User' }, favourites: [String] }, { timestamps: true }));
const Color = mongoose.model('Color', new Schema({ name: String, hex: String, brand: String, finishes: [String], tags: [String] }));
const Pattern = mongoose.model('Pattern', new Schema({ name: String, description: String, style: String, imageUrl: String, scale: Number }));
const Project = mongoose.model('Project', new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User' }, name: String,
  photo: String, thumb: String, regions: Array, settings: Object }, { timestamps: true }));
const Event = mongoose.model('Event', new Schema({ type: String, user: String, value: Number }, { timestamps: true }));

const h = f => (q, s, n) => f(q, s, n).catch(e => s.status(400).json({ error: e.message }));
const auth = role => (req, res, next) => {
  try { req.u = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); }
  catch { return res.status(401).json({ error: 'Login required' }); }
  if (role && req.u.role !== role) return res.status(403).json({ error: 'Admin only' });
  next();
};
const token = u => ({ token: jwt.sign({ id: u._id, role: u.role, name: u.name }, SECRET, { expiresIn: '7d' }), name: u.name, role: u.role });

app.post('/api/auth/register', h(async (q, s) => {
  const { name, email, password } = q.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 6) throw new Error('Valid name, email and 6+ char password required');
  const first = (await User.countDocuments()) === 0;
  const role = first || email === process.env.ADMIN_EMAIL ? 'Admin' : 'User';
  const u = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role });
  s.json(token(u));
}));
app.post('/api/auth/login', h(async (q, s) => {
  const u = await User.findOne({ email: q.body.email });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.passwordHash))) return s.status(401).json({ error: 'Invalid credentials' });
  s.json(token(u));
}));

app.get('/api/colors', h(async (q, s) => s.json(await Color.find())));
app.post('/api/colors', auth('Admin'), h(async (q, s) => s.json(await Color.create(q.body))));
app.put('/api/colors/:id', auth('Admin'), h(async (q, s) => s.json(await Color.findByIdAndUpdate(q.params.id, q.body, { new: true }))));
app.delete('/api/colors/:id', auth('Admin'), h(async (q, s) => { await Color.findByIdAndDelete(q.params.id); s.json({ ok: 1 }); }));

app.get('/api/patterns', h(async (q, s) => s.json(await Pattern.find())));
app.post('/api/patterns', auth('Admin'), h(async (q, s) => s.json(await Pattern.create(q.body))));
app.delete('/api/patterns/:id', auth('Admin'), h(async (q, s) => { await Pattern.findByIdAndDelete(q.params.id); s.json({ ok: 1 }); }));

app.get('/api/projects', auth(), h(async (q, s) => {
  const f = q.u.role === 'Admin' ? {} : { user: q.u.id };
  s.json(await Project.find(f, '-photo').populate('user', 'name').sort('-createdAt'));
}));
app.get('/api/projects/:id', auth(), h(async (q, s) => s.json(await Project.findById(q.params.id))));
app.post('/api/projects', auth(), h(async (q, s) => {
  if (!q.body.photo || !Array.isArray(q.body.regions)) throw new Error('photo and regions required');
  s.json(await Project.create({ ...q.body, user: q.u.id }));
}));
app.delete('/api/projects/:id', auth(), h(async (q, s) => {
  const p = await Project.findById(q.params.id);
  if (!p || (String(p.user) !== q.u.id && q.u.role !== 'Admin')) return s.status(403).json({ error: 'Not allowed' });
  await p.deleteOne(); s.json({ ok: 1 });
}));

app.post('/api/track', auth(), h(async (q, s) => { await Event.create({ type: q.body.type, user: q.u.name, value: q.body.value || 1 }); s.json({ ok: 1 }); }));
app.get('/api/admin/stats', auth('Admin'), h(async (q, s) => {
  const ses = await Event.find({ type: 'session' });
  s.json({ users: await User.countDocuments(), designsSaved: await Project.countDocuments(), colours: await Color.countDocuments(),
    uploads: await Event.countDocuments({ type: 'upload' }),
    avgSessionSeconds: ses.length ? Math.round(ses.reduce((a, e) => a + e.value, 0) / ses.length) : 0,
    feedback: await Event.find({ type: 'feedback' }).countDocuments() });
}));

const SEED = [['Ocean Breeze Blue', '#5b9bd5'], ['Sage Green', '#9caf88'], ['Warm Sand', '#e2c9a0'], ['Terracotta', '#c8663f'], ['Soft Lavender', '#b9a7d6'],
  ['Sunny Yellow', '#f2d16b'], ['Blush Pink', '#f2b5b5'], ['Charcoal', '#4a4f57'], ['Mint', '#a8dcc6'], ['Ivory', '#f3ecdc']];
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/paintvisualizer').then(async () => {
  if (!(await Color.countDocuments())) await Color.insertMany(SEED.map(([name, hex]) => ({ name, hex, brand: 'Sample', finishes: ['Matte', 'Satin'], tags: ['Living Room'] })));
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch(e => { console.error(e.message); process.exit(1); });
