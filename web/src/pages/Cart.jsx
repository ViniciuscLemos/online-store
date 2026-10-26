import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../api';
import { ProductCard, ProductImage, QuantityPicker } from '../components/common';
import { money } from '../format';
import { useStore } from '../store';

// an empty cart shows a few products instead of just a dead end
function EmptyCart() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products?limit=4').then((r) => setProducts(r.products)).catch(() => {});
  }, []);

  return (
    <>
      <div className="empty-state">
        <h1>Your cart is empty</h1>
        <p className="muted">Nothing here yet. The hoodie is pretty good, just saying.</p>
        <Link to="/" className="button">Start shopping</Link>
      </div>
      {products.length > 0 && (
        <section className="related">
          <h2>New in the store</h2>
          <div className="grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}

export default function Cart() {
  const { user, cart, setQuantity, refreshCart, notify } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function change(productId, quantity) {
    try {
      await setQuantity(productId, quantity);
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const { checkoutUrl } = await api.post('/orders');
      // Stripe's page (or the demo checkout); after paying it comes back to the order page
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e.message);
      refreshCart();
      setBusy(false);
    }
  }

  if (cart.items.length === 0) return <EmptyCart />;

  const blocked = cart.items.some((i) => !i.available);

  return (
    <div className="cart-page">
      <section>
        <div className="cart-head">
          <h1>Your cart</h1>
          <span className="muted">{cart.count} {cart.count === 1 ? 'item' : 'items'}</span>
        </div>
        <ul className="cart-list">
          {cart.items.map(({ product, quantity, available }) => (
            <li key={product.id}>
              <Link to={`/products/${product.slug}`} className="cart-thumb" tabIndex={-1} aria-hidden="true">
                <ProductImage product={product} size="thumb" />
              </Link>
              <div className="cart-item">
                <span className="label">{product.category}</span>
                <Link to={`/products/${product.slug}`} className="cart-name">{product.name}</Link>
                <span className="muted small">{money(product.priceCents)} each</span>
                {!available && <p className="error-text small">Only {product.stock} left. Lower the quantity.</p>}
                <button className="link remove" onClick={() => change(product.id, 0)}>Remove</button>
              </div>
              <div className="cart-qty">
                <QuantityPicker value={quantity} max={Math.max(quantity, product.stock)} onChange={(q) => change(product.id, q)} />
                <strong className="price line-total">{money(product.priceCents * quantity)}</strong>
              </div>
            </li>
          ))}
        </ul>
        <Link to="/" className="see-all">Keep shopping</Link>
      </section>

      <aside className="summary">
        <h2>Order summary</h2>
        <div className="row-between"><span>Subtotal</span><span className="price">{money(cart.subtotalCents)}</span></div>
        <div className="row-between"><span>Shipping</span><span>Free</span></div>
        <div className="row-between total"><span>Total</span><strong className="price">{money(cart.subtotalCents)}</strong></div>
        {error && <p className="error-box small">{error}</p>}
        {!user.emailVerified && (
          <p className="notice-small">Confirm your email before checking out. The link is in your <Link to="/inbox">inbox</Link>.</p>
        )}
        <button className="full" onClick={checkout} disabled={busy || blocked || !user.emailVerified}>
          {busy ? 'Opening the payment...' : 'Checkout'}
        </button>
        <p className="muted small">The items are reserved for 35 minutes while you pay.</p>
      </aside>
    </div>
  );
}
