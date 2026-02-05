import { Youtube } from "lucide-react";

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
          <div className="flex justify-center mt-4">
            <a
              href="https://youtu.be/pU5rlzU7cWM?si=I4SMZJD2EmFK234o"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Watch our YouTube video"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
