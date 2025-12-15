const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container py-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Exametric - Educational Research Platform
          </p>
          <p className="text-xs text-muted-foreground">
            Built with React, Vite & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
