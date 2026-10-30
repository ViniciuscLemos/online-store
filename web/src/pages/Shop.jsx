import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api';
import { Pagination, ProductCard, ProductGridSkeleton } from '../components/common';
import { money } from '../format';

// the hoodie is my favorite of the sample products, so it gets the top of the page.
// If an admin archives it, the block just doesn't show up
const FEATURED = 'merge-conflict-hoodie';

function Featured() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api.get(`/products/${FEATURED}`).then((r) => setProduct(r.product)).catch(() => {});
  }, []);

  if (!product) return null;
  const link = `/products/${product.slug}`;

  return (
    <section className="feature" aria-labelledby="feature-title">
      <Link to={link} className="feature-image" tabIndex={-1} aria-hidden="true">
        <img src={product.imageUrl} alt="" />
      </Link>
      <div className="feature-text">
        <p className="label">Staff pick</p>
        <h2 id="feature-title">{product.name}</h2>
        <p>{product.description}</p>
        <div className="feature-buy">
          <span className="price big">{money(product.priceCents)}</span>
          <Link to={link} className="button">View product</Link>
        </div>
      </div>
    </section>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);

  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Number(params.get('page') ?? 1);
  const search = params.get('search') ?? '';
  const inStock = params.get('in_stock') === '1';

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const query = new URLSearchParams({ sort, page, limit: 12 });
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    if (inStock) query.set('in_stock', '1');
    // the free server sleeps when nobody uses it, so the first load can take a while
    const timer = setTimeout(() => setSlow(true), 4000);
    api
      .get(`/products?${query}`)
      .then((r) => {
        setData(r);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        clearTimeout(timer);
        setSlow(false);
      });
    return () => clearTimeout(timer);
  }, [search, category, sort, page, inStock, attempt]);

  // changing a filter goes back to page 1
  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  }

  return (
    <>
      {!category && !search && page === 1 && <Featured />}

      <div className="catalog-head">
        <div>
          <h1>{search ? `Results for "${search}"` : category || 'All products'}</h1>
          {data && <p className="muted small">{data.total} {data.total === 1 ? 'product' : 'products'}</p>}
        </div>
        <div className="catalog-tools">
        <label className="in-stock small">
          <input type="checkbox" checked={inStock} onChange={(e) => update({ in_stock: e.target.checked ? '1' : '' })} />
          Only in stock
        </label>
        <label className="sort">
          <span className="muted small">Sort by</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        </div>
      </div>

      <div className="categories" role="group" aria-label="Categories">
        <button aria-pressed={!category} onClick={() => update({ category: '' })}>All</button>
        {categories.map((c) => (
          <button key={c} aria-pressed={category === c} onClick={() => update({ category: c })}>
            {c}
          </button>
        ))}
      </div>

      {error && (
        <div className="notice error" role="alert">
          <div>
            <strong>Couldn't load the products.</strong>
            <p>{error}</p>
          </div>
          <button className="secondary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </div>
      )}
      {!data && !error && (
        <>
          {slow && <p className="muted small">The server was asleep (it's on a free plan), give it a few more seconds...</p>}
          <ProductGridSkeleton />
        </>
      )}
      {data && data.products.length === 0 && (
        <div className="empty-state">
          <h2>{search ? `Nothing matches "${search}"` : 'Nothing here yet'}</h2>
          <p className="muted">Try another word or look at everything in the store.</p>
          <button className="secondary" onClick={() => setParams({})}>See all products</button>
        </div>
      )}

      {data && !error && (
        <>
          <div className="grid">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </>
  );
}
