import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="empty-state">
      <p className="label">Error 404</p>
      <h1>Page not found</h1>
      <p className="muted">This page doesn't exist or isn't yours. Maybe the link is old, or someone typed it by hand.</p>
      <Link to="/" className="button">Back to the shop</Link>
    </div>
  );
}
