import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { api } from '../api';
import { useStore } from '../store';
import { Icon } from './common';

function VerifyBanner() {
  const { user, notify } = useStore();
  const [sent, setSent] = useState(false);
  if (!user || user.emailVerified) return null;

  async function resend() {
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  return (
    <div className="banner">
      Confirm your email to place orders. Check your <Link to="/inbox">inbox</Link>.{' '}
      {sent ? <span>New email sent!</span> : <button className="link" onClick={resend}>Send it again</button>}
    </div>
  );
}

// the search lives in the header so it works from any page; it always lands on the shop
function HeaderSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const current = pathname === '/' ? params.get('search') ?? '' : '';
  const [text, setText] = useState(current);

  useEffect(() => setText(current), [current]);

  function onSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams(pathname === '/' ? params : undefined);
    next.delete('page');
    if (text.trim()) next.set('search', text.trim());
    else next.delete('search');
    navigate(`/?${next}`);
  }

  return (
    <form className="header-search" role="search" onSubmit={onSubmit}>
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search mugs, hoodies, keyboards..." aria-label="Search products" />
      <button type="submit" aria-label="Search"><Icon name="search" size={18} /></button>
    </form>
  );
}

function Footer() {
  const { user, config } = useStore();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <Link to="/" className="logo">
            <img src="/favicon.svg" alt="" width="26" height="26" />
            Online Store
          </Link>
          <p>
            A small store I built to learn how payments, stock and emails work for real. The products are made up, the code
            isn't.
          </p>
        </div>
        <nav aria-label="Shop">
          <h2 className="label">Shop</h2>
          <ul>
            <li><Link to="/">All products</Link></li>
            {categories.map((c) => (
              <li key={c}><Link to={`/?category=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Your account">
          <h2 className="label">Account</h2>
          <ul>
            {!user && <li><Link to="/login">Log in</Link></li>}
            {!user && <li><Link to="/register">Create an account</Link></li>}
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/orders">Orders</Link></li>
            {config.email === 'outbox' && <li><Link to="/inbox">Inbox</Link></li>}
          </ul>
        </nav>
        <nav aria-label="About the project">
          <h2 className="label">The project</h2>
          <ul>
            <li><a href="https://github.com/ViniciuscLemos/online-store" target="_blank" rel="noreferrer">Source code</a></li>
            <li><a href="https://github.com/ViniciuscLemos" target="_blank" rel="noreferrer">More of my projects</a></li>
          </ul>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Vinicius Lemos</span>
        {config.payments === 'demo' && <span>Payments use a fake checkout, no card needed.</span>}
      </div>
    </footer>
  );
}

export default function Layout() {
  const { user, cart, config, logout, toast } = useStore();
  const navigate = useNavigate();
  const demo = config.payments === 'demo' || config.email === 'outbox';

  async function onLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="page">
      {demo && (
        <p className="strip">
          Demo store: {config.payments === 'demo' ? 'nothing gets charged' : 'Stripe runs in test mode'}
          {config.email === 'outbox' && ' and the emails land in your Inbox'}.
        </p>
      )}
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="logo">
            <img src="/favicon.svg" alt="" width="30" height="30" />
            <span className="logo-text">Online Store</span>
          </Link>
          <HeaderSearch />
          <nav aria-label="Account">
            {user && <NavLink to="/orders">Orders</NavLink>}
            {user && config.email === 'outbox' && <NavLink to="/inbox">Inbox</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            {user ? (
              <button className="link" onClick={onLogout} title={user.email}>Log out</button>
            ) : (
              user === null && <NavLink to="/login">Log in</NavLink>
            )}
            <NavLink to="/cart" className="cart-link" aria-label={`Cart, ${cart.count} item${cart.count === 1 ? '' : 's'}`}>
              <Icon name="bag" size={20} />
              <span className="cart-text">Cart</span>
              <span className="badge">{cart.count}</span>
            </NavLink>
          </nav>
        </div>
      </header>

      <VerifyBanner />

      <main className="container">
        <Outlet />
      </main>

      <Footer />

      {toast && <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
