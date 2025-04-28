export function Button({
  asChild = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium transition disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white rounded-md',
    ghost: 'hover:bg-black/5 rounded-md',
    link: 'underline underline-offset-2 text-blue-600',
    outline: 'border rounded-md hover:bg-black/5',
  };
  const sizes = { sm: 'px-2 py-1 text-sm', md: 'px-3 py-1.5', lg: 'px-4 py-2' };
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (asChild) {
    // Render children without extra wrapper
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { className: `${children.props.className ?? ''} ${cls}`.trim() })
    }
    return children;
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
