import { Link } from 'react-router-dom'

interface Crumb {
  label: string
  path?: string
}

interface BreadcrumbsProps {
  crumbs: Crumb[]
}

export function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-400">/</span>}
            {isLast || !crumb.path ? (
              <span className="font-semibold text-gray-900">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} tabIndex={-1} className="text-gray-500 hover:text-blue-600 hover:underline">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
