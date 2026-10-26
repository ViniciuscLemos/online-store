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

  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Number(params.get('page') ?? 1);
  const search = params.get('search') ?? '';

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const query = new URLSearchParams({ sort, page, limit: 12 });
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    api
      .get(`/products?${query}`)
      .then((r) => {
        setData(r);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [search, category, sort, page]);

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

      <div className="categories" role="group" aria-label="Categories">
        <button aria-pressed={!category} onClick={() => update({ category: '' })}>All</button>
        {categories.map((c) => (
          <button key={c} aria-pressed={category === c} onClick={() => update({ category: c })}>
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error-box">{error}</p>}
      {!data && !error && <ProductGridSkeleton />}
      {data && data.products.length === 0 && <p className="muted center">No products found.</p>}

      {data && (
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
