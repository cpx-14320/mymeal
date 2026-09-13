export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-6 text-xs text-muted sm:px-6">
        <p>© {year} 智冠科技　MyMeal</p>
      </div>
    </footer>
  );
}
