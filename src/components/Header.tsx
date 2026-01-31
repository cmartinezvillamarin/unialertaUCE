import { motion } from "framer-motion";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-display text-2xl font-semibold text-foreground">
          Atelier
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#work" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            Work
          </a>
          <a href="#about" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#contact" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        <button className="px-5 py-2 bg-primary text-primary-foreground font-body text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
          Get Started
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
