import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../api';
import { ProductCard, ProductImage, QuantityPicker, Skeleton } from '../components/common';
import { money, stockLabel } from '../format';
import { useStore } from '../store';
import NotFound from './NotFound';

export default function ProductPage() {
  const { slug } = useParams();
  const { user, cart, setQuantity, notify } = useStore();
  const navigate = useNavigate();
  const [product, setProduct] = useState(undefined);
  const [quantity, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setProduct(undefined);
    api
      .get(`/products/${slug}`)
      .then((r) => setProduct(r.product))
      .catch(() => setProduct(null));
  }, [slug]);

  // a few more products from the same category, below the product
  const category = product?.category;
  useEffect(() => {
    if (!category) return;
    api
      .get(`/products?${new URLSearchParams({ category, limit: 5 })}`)
      .then((r) => setRelated(r.products.filter((p) => p.slug !== slug).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [category, slug]);

  if (product === undefined) {
    return (
      <div className="product-page" aria-busy="true">
        <Skeleton height="auto" radius={6} style={{ aspectRatio: '1', display: 'block' }} />
        <div className="stack">
          <Skeleton width="20%" height={12} radius={3} />
          <Skeleton width="70%" height={44} radius={4} />
          <Skeleton width="25%" height={28} radius={4} />
          <Skeleton height={48} radius={6} />
          <Skeleton height={120} radius={6} />
        </div>
      </div>
    );
  }
  if (product === null) return <NotFound />;

  const inCart = cart.items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  const canAdd = Math.max(0, product.stock - inCart);
  const stockClass = product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : '';

  async function add() {
    if (!user) return navigate(`/login?next=/products/${slug}`);
    setBusy(true);
    try {
      await setQuantity(product.id, inCart + quantity);
      notify(`${product.name} added to the cart.`);
      setQty(1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="breadcrumb small" aria-label="Breadcrumb">
        <Link to="/">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <div className="product-page">
        <div className="product-gallery">
          <ProductImage product={product} size="large" />
        </div>
        <div className="product-details">
          <p className="label">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="price big">{money(product.priceCents)}</p>
          <p className={`stock ${stockClass}`}>
            <span className="dot" aria-hidden="true" />
            {stockLabel(product.stock)}
            {stockClass === 'low' && ', order soon'}
          </p>

          {product.stock > 0 ? (
            <div className="buy">
              <QuantityPicker value={quantity} max={Math.max(1, canAdd)} onChange={setQty} disabled={canAdd === 0} />
              <button onClick={add} disabled={busy || canAdd === 0}>
                {canAdd === 0 ? 'All in your cart' : busy ? 'Adding...' : 'Add to cart'}
              </button>
            </div>
          ) : (
            <div className="buy">
              <button disabled>Sold out</button>
            </div>
          )}
          {inCart > 0 && (
            <p className="muted small">
              You have {inCart} in your <Link to="/cart">cart</Link>.
            </p>
          )}

          <div className="info-list">
            <details open>
              <summary>Description</summary>
              <p>{product.description}</p>
            </details>
            <details>
              <summary>Paying and reserving</summary>
              <p>
                When you go to the checkout the items are put aside for you for 35 minutes. If the payment doesn't happen in
                that time, they go back to the shelf. The order only counts as paid when Stripe tells the server, not when
                the browser says so.
              </p>
            </details>
            <details>
              <summary>Emails</summary>
              <p>You get one email when the payment goes through and another one when the order ships.</p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <div className="row-between">
            <h2>More in {product.category}</h2>
            <Link to={`/?category=${encodeURIComponent(product.category)}`} className="see-all">See all</Link>
          </div>
          <div className="grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
